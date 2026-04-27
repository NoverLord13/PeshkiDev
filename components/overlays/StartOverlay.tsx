import { APP_TITLE } from "../../lib/appConfig.ts";
import type { MainUiText } from "../../lib/uiText.ts";

type StartOverlayProps = {
  uiText: MainUiText;
  isMapReady: boolean;
  onStart: () => void;
};

const StartOverlay = ({ uiText, isMapReady, onStart }: StartOverlayProps) => (
  <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/70">
    <div className="glass-panel w-full max-w-md rounded-3xl px-8 py-10 text-white shadow-2xl">
      <h1 className="text-2xl font-semibold">{APP_TITLE}</h1>
      <div className="mt-6">
        <button
          type="button"
          disabled={!isMapReady}
          onClick={onStart}
          className={`w-full rounded-2xl px-5 py-4 text-center text-base font-semibold text-slate-900 shadow-lg transition ${
            isMapReady
              ? "bg-emerald-400/90 hover:scale-[1.02]"
              : "cursor-not-allowed bg-slate-300/70 text-slate-600 opacity-70"
          }`}
        >
          {uiText.startGame}
        </button>
      </div>
      {!isMapReady && <p className="mt-4 text-sm opacity-80">{uiText.loadingMap}</p>}
    </div>
  </div>
);

export default StartOverlay;
