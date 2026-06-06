import { createApp } from "vue";
import App from "./App.vue";
import "./styles.css";

function showRuntimeError(error: unknown) {
  const app = document.querySelector("#app");
  const message = error instanceof Error ? error.message : String(error);

  if (app) {
    app.innerHTML = `<div style="font-family: system-ui, sans-serif; padding: 24px; color: #991b1b">Erro ao carregar Smart Links: ${message}</div>`;
  }
}

window.addEventListener("error", (event) => {
  showRuntimeError(event.error ?? event.message);
});

window.addEventListener("unhandledrejection", (event) => {
  showRuntimeError(event.reason);
});

const app = createApp(App);

app.config.errorHandler = (error) => {
  showRuntimeError(error);
};

app.mount("#app");
