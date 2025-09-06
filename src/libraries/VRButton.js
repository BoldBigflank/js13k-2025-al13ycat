/**
 * A utility class for creating a button that allows to initiate
 * immersive VR sessions based on WebXR. The button can be created
 * with a factory method and then appended ot the website's DOM.
 *
 * ```js
 * document.body.appendChild( VRButton.createButton( renderer ) );
 * ```
 *
 * @hideconstructor
 * @three_import import { VRButton } from 'three/addons/webxr/VRButton.js';
 */
class VRButton {
  static createButton(renderer) {
    const button = document.createElement("button");
    let currentSession = null;

    async function onSessionStarted(session) {
      session.addEventListener("end", onSessionEnded);
      await renderer.xr.setSession(session);
      button.textContent = "EXIT VR";
      currentSession = session;
    }

    function onSessionEnded() {
      currentSession.removeEventListener("end", onSessionEnded);
      button.textContent = "ENTER VR";
      currentSession = null;
    }

    button.style.display = "block";
    button.textContent = "ENTER VR";
    button.id = "VRButton";

    button.onclick = function () {
      if (currentSession === null) {
        navigator.xr.requestSession("immersive-vr", {
          optionalFeatures: ["local-floor", "bounded-floor", "layers"]
        }).then(onSessionStarted);
      } else {
        currentSession.end();
      }
    };

    if ("xr" in navigator) {
      button.style.display = "none";
      navigator.xr.isSessionSupported("immersive-vr").then(function (supported) {
        if (supported) {
          button.style.display = "block";
        } else {
          button.textContent = "VR NOT SUPPORTED";
          button.setAttribute("data-disabled", "true");
        }
      }).catch(() => {
        button.textContent = "VR NOT ALLOWED";
        button.setAttribute("data-disabled", "true");
      });
      return button;
    } else {
      const message = document.createElement("a");
      message.innerHTML = "WEBXR NOT AVAILABLE";
      message.className = "m";
      return message;
    }
  }
}

export { VRButton };
