import bundledServers from "@/data/servers.json";
import {
  BaseDirectory,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { logger } from "./logger";

const RESOURCES: Record<string, GameConfig> = {
  "servers.json": bundledServers as unknown as GameConfig,
};

interface Cluster {
  id: string;
  domain: string;
  location: string;
  location_key: string;
  ips: string[];
}

interface Region {
  id: string;
  name: string;
  name_key: string;
  alias_name: string;
  icon: string;
  flag_icon: string;
  clusters: Cluster[];
}

interface GameConfig {
  appId: number;
  id: string;
  alias_name: string;
  name: string;
  regions: Region[];
  clusters?: any; // Нужен только для старых версий!
  [key: string]: any;
}

/*
 * Умный merge файлов конфигурации.
 */
export async function ensureClusters() {
  try {
    await mkdir("resources", {
      baseDir: BaseDirectory.AppLocalData,
      recursive: true,
    });

    for (const [file, bundled] of Object.entries(RESOURCES)) {
      const targetPath = `resources/${file}`;

      const freshConfig: GameConfig = structuredClone(bundled);

      // Удаляем устаревший массив, использовался до версии 0.1.4
      delete freshConfig.clusters;

      const targetExists = await exists(targetPath, {
        baseDir: BaseDirectory.AppLocalData,
      });

      if (!targetExists) {
        await writeTextFile(targetPath, JSON.stringify(freshConfig, null, 2), {
          baseDir: BaseDirectory.AppLocalData,
        });
        logger.log(`Создан базовый ресурс конфигурации: ${file}`);
        continue;
      }

      // Если файл существует — мерджим только массив regions
      const userContentRaw = await readTextFile(targetPath, {
        baseDir: BaseDirectory.AppLocalData,
      });

      try {
        const userConfig: GameConfig = JSON.parse(userContentRaw);

        delete userConfig.clusters;

        const mergeRegions = (
          userRegionsList: Region[],
          freshRegionsList: Region[],
        ): Region[] => {
          const mergedMap = new Map<string, Region>();
          for (const r of userRegionsList) mergedMap.set(r.id, r);

          for (const freshRegion of freshRegionsList) {
            if (!mergedMap.has(freshRegion.id)) {
              mergedMap.set(freshRegion.id, freshRegion);
            } else {
              // Регион уже есть, мерджим кластеры внутри него
              const userRegion = mergedMap.get(freshRegion.id)!;
              const clusterMap = new Map<string, Cluster>();

              for (const c of userRegion.clusters) clusterMap.set(c.id, c);

              // Добавляем новые официальные кластеры, не затирая кастомные изменения
              for (const freshCluster of freshRegion.clusters) {
                if (!clusterMap.has(freshCluster.id)) {
                  clusterMap.set(freshCluster.id, freshCluster);
                }
              }

              userRegion.clusters = Array.from(clusterMap.values());
              mergedMap.set(freshRegion.id, userRegion);
            }
          }
          return Array.from(mergedMap.values());
        };

        if (
          Array.isArray(userConfig.regions) &&
          Array.isArray(freshConfig.regions)
        ) {
          userConfig.regions = mergeRegions(
            userConfig.regions,
            freshConfig.regions,
          );
        }

        // Объединяем метаданные (постеры, иконки) и результат мерджа регионов
        const updatedConfig = {
          ...freshConfig,
          ...userConfig,
          regions: userConfig.regions,
        };

        await writeTextFile(
          targetPath,
          JSON.stringify(updatedConfig, null, 2),
          { baseDir: BaseDirectory.AppLocalData },
        );
        logger.log(
          `Конфигурация серверов успешно очищена от устаревших данных и синхронизирована: ${file}`,
        );
      } catch (parseErr) {
        logger.error(
          `Файл пользователя ${file} поврежден или невалиден (${parseErr}). Восстанавливаем дефолт`,
        );
        await writeTextFile(targetPath, JSON.stringify(freshConfig, null, 2), {
          baseDir: BaseDirectory.AppLocalData,
        });
      }
    }
  } catch (err) {
    logger.error(err);
    throw new Error(`Ошибка выполнения проверки файлов конфигурации: ${err}`);
  }
}
