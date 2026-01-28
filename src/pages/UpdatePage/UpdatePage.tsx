import { useUnit } from "effector-react";
import { PageContainer } from "../../shared/components/PageContainer";
import {
  $updateStatus,
  $updateInfo,
  $downloadProgress,
  UpdateStatus,
  startDownload,
  installUpdate,
  dismissUpdate,
} from "../../features/updater/model";

const STATUS_LABELS: Partial<Record<UpdateStatus, string>> = {
  [UpdateStatus.AVAILABLE]: "UPDATE_AVAILABLE",
  [UpdateStatus.DOWNLOADING]: "DOWNLOADING",
  [UpdateStatus.DOWNLOADED]: "READY",
};

const PRIMARY_BTN =
  "flex-1 px-3 py-1.5 bg-[#0F0401] text-white font-mono text-[10px] tracking-wider hover:bg-gray-800 transition-colors rounded";
const SECONDARY_BTN =
  "px-3 py-1.5 bg-gray-200 text-[#0F0401] font-mono text-[10px] tracking-wider hover:bg-gray-300 transition-colors rounded";

export function UpdatePage(): JSX.Element {
  const { status, info, progress, onDownload, onInstall, onDismiss } = useUnit({
    status: $updateStatus,
    info: $updateInfo,
    progress: $downloadProgress,
    onDownload: startDownload,
    onInstall: installUpdate,
    onDismiss: dismissUpdate,
  });

  return (
    <PageContainer>
      <div className="w-full h-full flex flex-col items-center justify-center px-6 py-4">
        <div className="font-mono text-[10px] tracking-wider text-gray-500 mb-2">
          {STATUS_LABELS[status]}
        </div>

        {info && (
          <div className="font-mono text-sm text-[#0F0401] mb-3">
            v{info.version}
          </div>
        )}

        {status === UpdateStatus.DOWNLOADING && progress && (
          <div className="w-full mb-3">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0F0401] transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="font-mono text-[9px] text-gray-400 text-center mt-1">
              {Math.round(progress.percent)}%
            </div>
          </div>
        )}

        <div className="flex gap-2 w-full">
          {status === UpdateStatus.AVAILABLE && (
            <>
              <button onClick={onDownload} className={PRIMARY_BTN}>
                DOWNLOAD
              </button>
              <button onClick={onDismiss} className={SECONDARY_BTN}>
                LATER
              </button>
            </>
          )}

          {status === UpdateStatus.DOWNLOADED && (
            <>
              <button onClick={onInstall} className={PRIMARY_BTN}>
                INSTALL
              </button>
              <button onClick={onDismiss} className={SECONDARY_BTN}>
                LATER
              </button>
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
