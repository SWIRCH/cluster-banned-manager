package com.aysi.clusterbanned.vpn

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.ConnectivityManager
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.Inet4Address
import java.net.InetAddress
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean

class ClusterVpnService : VpnService() {
    private var vpnInterface: ParcelFileDescriptor? = null
    private var worker: Thread? = null
    private val stopping = AtomicBoolean(false)
    private var upstreamDns: List<String> = emptyList()

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) {
            stopCurrentVpn()
            stopForeground(true)
            stopSelf(startId)
            return START_NOT_STICKY
        }

        if (intent?.action != ACTION_START) return START_NOT_STICKY

        val domains = intent.getStringArrayListExtra(EXTRA_DOMAINS).orEmpty()
        val ips = intent.getStringArrayListExtra(EXTRA_IPS).orEmpty()
        stopCurrentVpn()
        currentDomains = domains
        currentIps = ips
        startForeground(NOTIFICATION_ID, notification())
        startDnsVpn(domains, ips)
        return START_STICKY
    }

    override fun onDestroy() {
        stopCurrentVpn()
        stopForeground(true)
        super.onDestroy()
    }

    private fun stopCurrentVpn() {
        stopping.set(true)
        worker?.interrupt()
        worker = null
        try {
            vpnInterface?.close()
        } catch (_: Exception) {
        }
        vpnInterface = null
        currentDomains = emptyList()
        currentIps = emptyList()
        currentState = STATE_OFF
    }

    private fun startDnsVpn(domains: List<String>, ips: List<String>) {
        stopping.set(false)

        val builder = Builder()
            .setSession("Cluster Banned Manager")
            .setMtu(1500)
            .addAddress(VPN_ADDRESS, 30)
            .addRoute(DNS_ADDRESS, 32)
            .addDnsServer(DNS_ADDRESS)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            builder.setMetered(false)
        }
        builder.setBlocking(true)
        upstreamDns = captureUpstreamDns()

        for (ip in ips) {
            val trimmed = ip.trim()
            if (trimmed.isEmpty() || trimmed == DNS_ADDRESS || trimmed == VPN_ADDRESS) continue
            try {
                val address = InetAddress.getByName(trimmed)
                if (address is Inet4Address) {
                    builder.addRoute(trimmed, 32)
                }
            } catch (_: Exception) {
            }
        }

        vpnInterface = builder.establish()

        val descriptor = vpnInterface ?: run {
            currentState = STATE_ERROR
            return
        }

        currentState = STATE_ON
        worker = Thread {
            FileInputStream(descriptor.fileDescriptor).use { input ->
                FileOutputStream(descriptor.fileDescriptor).use { output ->
                    processPackets(input, output, domains)
                }
            }
        }.also {
            it.name = "cluster-vpn-dns"
            it.isDaemon = true
            it.start()
        }
    }

    private fun processPackets(
        input: FileInputStream,
        output: FileOutputStream,
        domains: List<String>,
    ) {
        val packet = ByteArray(32767)
        while (!stopping.get() && !Thread.currentThread().isInterrupted) {
            val length = try {
                input.read(packet)
            } catch (_: Exception) {
                break
            }
            if (length > 0) {
                handleIpv4Udp(packet, length, output, domains)
            }
        }
    }

    private fun handleIpv4Udp(
        packet: ByteArray,
        length: Int,
        output: FileOutputStream,
        domains: List<String>,
    ) {
        if (length < IPV4_HEADER_LENGTH || packet[0].toInt() ushr 4 != 4) return
        val ipHeaderLength = (packet[0].toInt() and 0x0f) * 4
        if (ipHeaderLength < IPV4_HEADER_LENGTH || length < ipHeaderLength + UDP_HEADER_LENGTH) return
        if (packet[9].toInt() and 0xff != UDP_PROTOCOL) return

        val destinationPort = readUnsignedShort(packet, ipHeaderLength + 2)
        if (destinationPort != DNS_PORT) return
        if (!isDnsDestination(packet)) return

        val sourcePort = readUnsignedShort(packet, ipHeaderLength)
        val dnsOffset = ipHeaderLength + UDP_HEADER_LENGTH
        val dnsLength = length - dnsOffset
        if (dnsLength < DNS_HEADER_LENGTH) return

        val domain = readQuestionName(packet, dnsOffset, dnsLength) ?: return
        val blocked = domains.any { isDomainBlocked(domain, it) }
        val responseDns = if (blocked) {
            buildBlockedDnsResponse(packet, dnsOffset, dnsLength)
        } else {
            queryUpstreamDns(packet, dnsOffset, dnsLength)
                ?: buildServFail(packet, dnsOffset, dnsLength)
        } ?: return

        val response = buildUdpIpv4Response(
            packet,
            ipHeaderLength,
            sourcePort,
            responseDns,
        )
        try {
            output.write(response)
            output.flush()
        } catch (_: Exception) {
        }
    }

    private fun isDnsDestination(packet: ByteArray): Boolean {
        return packet[16] == DNS_ADDRESS_BYTES[0] &&
            packet[17] == DNS_ADDRESS_BYTES[1] &&
            packet[18] == DNS_ADDRESS_BYTES[2] &&
            packet[19] == DNS_ADDRESS_BYTES[3]
    }

    private fun captureUpstreamDns(): List<String> {
        val servers = mutableListOf<String>()
        try {
            val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
            val network = cm.activeNetwork
            val properties = network?.let { cm.getLinkProperties(it) }
            properties?.dnsServers?.forEach { dns ->
                val host = dns.hostAddress ?: return@forEach
                if (host.isNotEmpty() && host != DNS_ADDRESS && host != VPN_ADDRESS) {
                    servers += host
                }
            }
        } catch (_: Exception) {
        }
        return servers.distinct()
    }

    private fun queryUpstreamDns(packet: ByteArray, dnsOffset: Int, dnsLength: Int): ByteArray? {
        val servers = (upstreamDns + UPSTREAM_DNS.toList()).distinct()
        for (upstream in servers) {
            val response = queryOneUpstream(packet, dnsOffset, dnsLength, upstream)
            if (response != null) return response
        }
        return null
    }

    private fun queryOneUpstream(
        packet: ByteArray,
        dnsOffset: Int,
        dnsLength: Int,
        upstream: String,
    ): ByteArray? {
        return try {
            DatagramSocket().use { socket ->
                if (!protect(socket)) return null
                socket.soTimeout = DNS_TIMEOUT_MS
                val address = InetAddress.getByName(upstream)
                socket.send(DatagramPacket(packet, dnsOffset, dnsLength, address, DNS_PORT))
                val response = ByteArray(4096)
                val responsePacket = DatagramPacket(response, response.size)
                socket.receive(responsePacket)
                if (responsePacket.length < DNS_HEADER_LENGTH) null
                else response.copyOf(responsePacket.length)
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun buildBlockedDnsResponse(packet: ByteArray, dnsOffset: Int, dnsLength: Int): ByteArray? {
        val questionEnd = questionSectionEnd(packet, dnsOffset, dnsLength) ?: return null
        val typeOffset = questionEnd - 4
        val qtype = readUnsignedShort(packet, typeOffset)
        val questionLen = questionEnd - dnsOffset

        val rdata: ByteArray? = when (qtype) {
            TYPE_A -> byteArrayOf(0, 0, 0, 0)
            TYPE_AAAA -> ByteArray(16)
            else -> null
        }

        if (rdata == null) {
            val response = ByteArray(questionLen)
            System.arraycopy(packet, dnsOffset, response, 0, questionLen)
            setDnsFlags(response, packet, dnsOffset, answerCount = 0, rcode = 0)
            return response
        }

        val response = ByteArray(questionLen + 12 + rdata.size)
        System.arraycopy(packet, dnsOffset, response, 0, questionLen)
        setDnsFlags(response, packet, dnsOffset, answerCount = 1, rcode = 0)

        var cursor = questionLen
        response[cursor++] = 0xc0.toByte()
        response[cursor++] = 0x0c.toByte()
        writeShort(response, cursor, qtype)
        cursor += 2
        writeShort(response, cursor, CLASS_IN)
        cursor += 2
        writeInt(response, cursor, 60)
        cursor += 4
        writeShort(response, cursor, rdata.size)
        cursor += 2
        System.arraycopy(rdata, 0, response, cursor, rdata.size)
        return response
    }

    private fun buildServFail(packet: ByteArray, dnsOffset: Int, dnsLength: Int): ByteArray? {
        val questionEnd = questionSectionEnd(packet, dnsOffset, dnsLength) ?: return null
        val questionLen = questionEnd - dnsOffset
        val response = ByteArray(questionLen)
        System.arraycopy(packet, dnsOffset, response, 0, questionLen)
        setDnsFlags(response, packet, dnsOffset, answerCount = 0, rcode = 2)
        return response
    }

    private fun setDnsFlags(
        response: ByteArray,
        query: ByteArray,
        dnsOffset: Int,
        answerCount: Int,
        rcode: Int,
    ) {
        val rd = query[dnsOffset + 2].toInt() and 0x01
        response[2] = (0x80 or rd).toByte()
        response[3] = (0x80 or (rcode and 0x0f)).toByte()
        writeShort(response, 6, answerCount)
        writeShort(response, 8, 0)
        writeShort(response, 10, 0)
    }

    private fun questionSectionEnd(packet: ByteArray, offset: Int, length: Int): Int? {
        var cursor = offset + DNS_HEADER_LENGTH
        val end = offset + length
        while (cursor < end) {
            val labelLength = packet[cursor].toInt() and 0xff
            if (labelLength == 0) {
                cursor += 1
                break
            }
            if (labelLength and 0xc0 == 0xc0) {
                cursor += 2
                break
            }
            if (labelLength > 63) return null
            cursor += 1 + labelLength
        }
        if (cursor + 4 > end) return null
        return cursor + 4
    }

    private fun buildUdpIpv4Response(
        request: ByteArray,
        ipHeaderLength: Int,
        destinationPort: Int,
        dnsPayload: ByteArray,
    ): ByteArray {
        val clientAddress = request.copyOfRange(12, 16)
        val dnsAddress = request.copyOfRange(16, 20)
        val totalLength = IPV4_HEADER_LENGTH + UDP_HEADER_LENGTH + dnsPayload.size
        val response = ByteArray(totalLength)
        response[0] = 0x45
        response[1] = 0
        writeShort(response, 2, totalLength)
        writeShort(response, 4, 0)
        writeShort(response, 6, 0)
        response[8] = 64
        response[9] = UDP_PROTOCOL.toByte()
        System.arraycopy(dnsAddress, 0, response, 12, 4)
        System.arraycopy(clientAddress, 0, response, 16, 4)
        writeShort(response, 10, checksum(response, 0, IPV4_HEADER_LENGTH))

        writeShort(response, IPV4_HEADER_LENGTH, DNS_PORT)
        writeShort(response, IPV4_HEADER_LENGTH + 2, destinationPort)
        writeShort(response, IPV4_HEADER_LENGTH + 4, UDP_HEADER_LENGTH + dnsPayload.size)
        writeShort(response, IPV4_HEADER_LENGTH + 6, 0)
        System.arraycopy(
            dnsPayload,
            0,
            response,
            IPV4_HEADER_LENGTH + UDP_HEADER_LENGTH,
            dnsPayload.size,
        )
        writeShort(
            response,
            IPV4_HEADER_LENGTH + 6,
            udpChecksum(response, IPV4_HEADER_LENGTH, totalLength, dnsAddress, clientAddress),
        )
        return response
    }

    private fun readQuestionName(packet: ByteArray, offset: Int, length: Int): String? {
        var cursor = offset + DNS_HEADER_LENGTH
        val end = offset + length
        val labels = mutableListOf<String>()
        while (cursor < end) {
            val labelLength = packet[cursor++].toInt() and 0xff
            if (labelLength == 0) break
            if (labelLength and 0xc0 == 0xc0) return null
            if (labelLength > 63 || cursor + labelLength > end) return null
            labels += String(packet, cursor, labelLength, Charsets.US_ASCII)
            cursor += labelLength
        }
        return labels.joinToString(".").lowercase(Locale.ROOT)
    }

    private fun isDomainBlocked(query: String, blocked: String): Boolean {
        val normalized = blocked.trim().trimEnd('.').lowercase(Locale.ROOT)
        if (normalized.isEmpty()) return false
        return query == normalized || query.endsWith(".$normalized")
    }

    private fun checksum(data: ByteArray, offset: Int, length: Int): Int {
        var sum = 0L
        var index = offset
        while (index + 1 < offset + length) {
            sum += readUnsignedShort(data, index)
            index += 2
        }
        if (index < offset + length) sum += (data[index].toInt() and 0xff).toLong() shl 8
        while (sum ushr 16 != 0L) sum = (sum and 0xffff) + (sum ushr 16)
        return sum.inv().toInt() and 0xffff
    }

    private fun udpChecksum(
        packet: ByteArray,
        udpOffset: Int,
        totalLength: Int,
        source: ByteArray,
        destination: ByteArray,
    ): Int {
        val udpLength = totalLength - udpOffset
        val pseudo = ByteArray(12 + udpLength)
        System.arraycopy(source, 0, pseudo, 0, 4)
        System.arraycopy(destination, 0, pseudo, 4, 4)
        pseudo[9] = UDP_PROTOCOL.toByte()
        writeShort(pseudo, 10, udpLength)
        System.arraycopy(packet, udpOffset, pseudo, 12, udpLength)
        pseudo[18] = 0
        pseudo[19] = 0
        return checksum(pseudo, 0, pseudo.size)
    }

    private fun readUnsignedShort(data: ByteArray, offset: Int): Int {
        return ByteBuffer.wrap(data, offset, 2).order(ByteOrder.BIG_ENDIAN).short.toInt() and 0xffff
    }

    private fun writeShort(data: ByteArray, offset: Int, value: Int) {
        data[offset] = (value ushr 8).toByte()
        data[offset + 1] = value.toByte()
    }

    private fun writeInt(data: ByteArray, offset: Int, value: Int) {
        data[offset] = (value ushr 24).toByte()
        data[offset + 1] = (value ushr 16).toByte()
        data[offset + 2] = (value ushr 8).toByte()
        data[offset + 3] = value.toByte()
    }

    private fun notification(): Notification {
        val manager = getSystemService(NotificationManager::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_ID,
                    "Cluster VPN",
                    NotificationManager.IMPORTANCE_LOW,
                ),
            )
        }

        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = launchIntent?.let {
            PendingIntent.getActivity(
                this,
                0,
                it,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Cluster Banned Manager")
            .setContentText("Блокировка кластеров включена")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .build()
    }

    companion object {
        private const val CHANNEL_ID = "cluster-vpn"
        private const val NOTIFICATION_ID = 7402
        const val ACTION_START = "com.aysi.clusterbanned.vpn.START"
        const val ACTION_STOP = "com.aysi.clusterbanned.vpn.STOP"
        const val EXTRA_DOMAINS = "domains"
        const val EXTRA_IPS = "ips"
        const val STATE_OFF = "off"
        const val STATE_ON = "on"
        const val STATE_ERROR = "error"

        private const val VPN_ADDRESS = "10.8.0.2"
        private const val DNS_ADDRESS = "10.8.0.1"
        private val DNS_ADDRESS_BYTES = byteArrayOf(10, 8, 0, 1)
        private val UPSTREAM_DNS = arrayOf("8.8.8.8", "77.88.8.8", "1.1.1.1")
        private const val DNS_PORT = 53
        private const val DNS_TIMEOUT_MS = 2500
        private const val UDP_PROTOCOL = 17
        private const val IPV4_HEADER_LENGTH = 20
        private const val UDP_HEADER_LENGTH = 8
        private const val DNS_HEADER_LENGTH = 12
        private const val TYPE_A = 1
        private const val TYPE_AAAA = 28
        private const val CLASS_IN = 1

        @Volatile
        private var currentState = STATE_OFF

        @Volatile
        private var currentDomains: List<String> = emptyList()

        @Volatile
        private var currentIps: List<String> = emptyList()

        fun start(context: Context, domains: List<String>, ips: List<String> = emptyList()) {
            val intent = Intent(context, ClusterVpnService::class.java).apply {
                action = ACTION_START
                putStringArrayListExtra(EXTRA_DOMAINS, ArrayList(domains))
                putStringArrayListExtra(EXTRA_IPS, ArrayList(ips))
            }
            ContextCompat.startForegroundService(context, intent)
        }

        fun stop(context: Context) {
            context.startService(Intent(context, ClusterVpnService::class.java).apply {
                action = ACTION_STOP
            })
        }

        fun state(): String = currentState

        fun domains(): List<String> = currentDomains
    }
}
