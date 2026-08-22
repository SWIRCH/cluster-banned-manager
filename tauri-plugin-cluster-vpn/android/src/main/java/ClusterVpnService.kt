package com.aysi.clusterbanned.vpn

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.DatagramPacket
import java.net.DatagramSocket
import java.net.InetAddress
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.Locale
import java.util.concurrent.atomic.AtomicBoolean

class ClusterVpnService : VpnService() {
    private var vpnInterface: android.os.ParcelFileDescriptor? = null
    private var worker: Thread? = null
    private val stopping = AtomicBoolean(false)

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP || intent?.action == null) {
            stopCurrentVpn()
            stopForeground(true)
            stopSelf(startId)
            return START_NOT_STICKY
        }

        if (intent.action != ACTION_START) return START_NOT_STICKY

        val domains = intent?.getStringArrayListExtra(EXTRA_DOMAINS).orEmpty()
        stopCurrentVpn()
        currentDomains = domains
        startForeground(NOTIFICATION_ID, notification())
        startDnsVpn(domains)
        return START_NOT_STICKY
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
        vpnInterface?.close()
        vpnInterface = null
        currentDomains = emptyList()
        currentState = STATE_OFF
    }

    private fun startDnsVpn(domains: List<String>) {
        vpnInterface?.close()
        stopping.set(false)

        vpnInterface = Builder()
            .setSession("Cluster Banned Manager")
            .setMtu(1500)
            .addAddress(VPN_ADDRESS, 32)
            .addRoute(VPN_ADDRESS, 32)
            .addDnsServer(VPN_ADDRESS)
            .establish()

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
        } ?: return

        val response = buildUdpIpv4Response(
            packet,
            ipHeaderLength,
            sourcePort,
            responseDns,
        )
        output.write(response)
        output.flush()
    }

    private fun queryUpstreamDns(packet: ByteArray, dnsOffset: Int, dnsLength: Int): ByteArray? {
        return try {
            DatagramSocket().use { socket ->
                if (!protect(socket)) return null
                socket.soTimeout = DNS_TIMEOUT_MS
                val address = InetAddress.getByName(UPSTREAM_DNS)
                socket.send(DatagramPacket(packet, dnsOffset, dnsLength, address, DNS_PORT))
                val response = ByteArray(4096)
                val responsePacket = DatagramPacket(response, response.size)
                socket.receive(responsePacket)
                response.copyOf(responsePacket.length)
            }
        } catch (_: Exception) {
            null
        }
    }

    private fun buildBlockedDnsResponse(packet: ByteArray, dnsOffset: Int, dnsLength: Int): ByteArray {
        val response = packet.copyOfRange(dnsOffset, dnsOffset + dnsLength)
        response[2] = (response[2].toInt() or 0x80).toByte()
        response[3] = (response[3].toInt() or 0x03).toByte()
        response[4] = 0
        response[5] = 1
        response[6] = 0
        response[7] = 0
        response[8] = 0
        response[9] = 0
        response[10] = 0
        response[11] = 0
        return response
    }

    private fun buildUdpIpv4Response(
        request: ByteArray,
        ipHeaderLength: Int,
        destinationPort: Int,
        dnsPayload: ByteArray,
    ): ByteArray {
        val sourceAddress = request.copyOfRange(12, 16)
        val destinationAddress = request.copyOfRange(16, 20)
        val totalLength = ipHeaderLength + UDP_HEADER_LENGTH + dnsPayload.size
        val response = ByteArray(totalLength)
        response[0] = 0x45
        response[1] = 0
        writeShort(response, 2, totalLength)
        writeShort(response, 4, 0)
        writeShort(response, 6, 0)
        response[8] = 64
        response[9] = UDP_PROTOCOL.toByte()
        System.arraycopy(destinationAddress, 0, response, 12, 4)
        System.arraycopy(sourceAddress, 0, response, 16, 4)
        writeShort(response, 10, checksum(response, 0, ipHeaderLength))

        writeShort(response, ipHeaderLength, DNS_PORT)
        writeShort(response, ipHeaderLength + 2, destinationPort)
        writeShort(response, ipHeaderLength + 4, UDP_HEADER_LENGTH + dnsPayload.size)
        writeShort(response, ipHeaderLength + 6, 0)
        System.arraycopy(dnsPayload, 0, response, ipHeaderLength + UDP_HEADER_LENGTH, dnsPayload.size)
        writeShort(response, ipHeaderLength + 6, udpChecksum(response, ipHeaderLength, totalLength, sourceAddress, destinationAddress))
        return response
    }

    private fun readQuestionName(packet: ByteArray, offset: Int, length: Int): String? {
        var cursor = offset + DNS_HEADER_LENGTH
        val end = offset + length
        val labels = mutableListOf<String>()
        while (cursor < end) {
            val labelLength = packet[cursor++].toInt() and 0xff
            if (labelLength == 0) break
            if (labelLength > 63 || cursor + labelLength > end) return null
            labels += String(packet, cursor, labelLength, Charsets.US_ASCII)
            cursor += labelLength
        }
        return labels.joinToString(".").lowercase(Locale.ROOT)
    }

    private fun isDomainBlocked(query: String, blocked: String): Boolean {
        val normalized = blocked.trim().trimEnd('.').lowercase(Locale.ROOT)
        return query == normalized || query.endsWith(".$normalized")
    }

    private fun checksum(data: ByteArray, offset: Int, length: Int): Int {
        var sum = 0L
        var index = offset
        while (index + 1 < offset + length) {
            sum += readUnsignedShort(data, index)
            index += 2
        }
        if (index < offset + length) sum += (data[index].toInt() and 0xff) shl 8
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
        val pseudo = ByteArray(12 + totalLength - udpOffset)
        System.arraycopy(source, 0, pseudo, 0, 4)
        System.arraycopy(destination, 0, pseudo, 4, 4)
        pseudo[9] = UDP_PROTOCOL.toByte()
        writeShort(pseudo, 10, totalLength - udpOffset)
        System.arraycopy(packet, udpOffset, pseudo, 12, totalLength - udpOffset)
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
            .setContentText("Cluster VPN service is running")
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
        const val STATE_OFF = "off"
        const val STATE_ON = "on"
        const val STATE_ERROR = "error"
        private const val VPN_ADDRESS = "10.0.0.2"
        private const val UPSTREAM_DNS = "1.1.1.1"
        private const val DNS_PORT = 53
        private const val DNS_TIMEOUT_MS = 2500
        private const val UDP_PROTOCOL = 17
        private const val IPV4_HEADER_LENGTH = 20
        private const val UDP_HEADER_LENGTH = 8
        private const val DNS_HEADER_LENGTH = 12

        @Volatile
        private var currentState = STATE_OFF

        @Volatile
        private var currentDomains: List<String> = emptyList()

        fun start(context: Context, domains: List<String>) {
            val intent = Intent(context, ClusterVpnService::class.java).apply {
                action = ACTION_START
                putStringArrayListExtra(EXTRA_DOMAINS, ArrayList(domains))
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