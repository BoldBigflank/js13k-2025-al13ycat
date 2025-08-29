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
  /**
   * Constructs a new VR button.
   *
   * @param {WebGLRenderer|WebGPURenderer} renderer - The renderer.
   * @param {XRSessionInit} [sessionInit] - The a configuration object for the AR session.
   * @return {HTMLElement} The button or an error message if `immersive-ar` isn't supported.
   */
  static createButton(renderer, sessionInit = {}) {
    const button = document.createElement("button");

    function showEnterVR(/*device*/) {
      let currentSession = null;

      async function onSessionStarted(session) {
        session.addEventListener("end", onSessionEnded);

        await renderer.xr.setSession(session);
        button.textContent = "EXIT VR";

        currentSession = session;
      }

      function onSessionEnded(/*event*/) {
        currentSession.removeEventListener("end", onSessionEnded);

        button.textContent = "ENTER VR";

        currentSession = null;
      }

      //

      button.style.display = "block";
      button.removeAttribute("data-disabled");
      button.textContent = "ENTER VR";

      // WebXR's requestReferenceSpace only works if the corresponding feature
      // was requested at session creation time. For simplicity, just ask for
      // the interesting ones as optional features, but be aware that the
      // requestReferenceSpace call will fail if it turns out to be unavailable.
      // ('local' is always available for immersive sessions and doesn't need to
      // be requested separately.)

      const sessionOptions = {
        ...sessionInit,
        optionalFeatures: [
          "local-floor",
          "bounded-floor",
          "layers",
          ...(sessionInit.optionalFeatures || []),
        ],
      };

      button.onclick = function () {
        if (currentSession === null) {
          navigator.xr
            .requestSession("immersive-vr", sessionOptions)
            .then(onSessionStarted);
        } else {
          currentSession.end();

          if (navigator.xr.offerSession !== undefined) {
            navigator.xr
              .offerSession("immersive-vr", sessionOptions)
              .then(onSessionStarted)
              .catch((err) => {
                console.warn(err);
              });
          }
        }
      };

      if (navigator.xr.offerSession !== undefined) {
        navigator.xr
          .offerSession("immersive-vr", sessionOptions)
          .then(onSessionStarted)
          .catch((err) => {
            console.warn(err);
          });
      }
    }

    function disableButton() {
      button.style.display = "block";
      button.setAttribute("data-disabled", "true");

      button.onmouseenter = null;
      button.onmouseleave = null;

      button.onclick = null;
    }

    function showWebXRNotFound() {
      disableButton();

      button.textContent = "VR NOT SUPPORTED";
    }

    function showVRNotAllowed(exception) {
      disableButton();

      console.warn(
        "Exception when trying to call xr.isSessionSupported",
        exception,
      );

      button.textContent = "VR NOT ALLOWED";
    }

    function stylizeElement(element) {
      // Styles are now handled by CSS
    }

    if ("xr" in navigator) {
      button.id = "VRButton";
      button.style.display = "none";

      stylizeElement(button);

      navigator.xr
        .isSessionSupported("immersive-vr")
        .then(function (supported) {
          supported ? showEnterVR() : showWebXRNotFound();

          if (supported && VRButton.xrSessionIsGranted) {
            button.click();
          }
        })
        .catch(showVRNotAllowed);

      return button;
    } else {
      const message = document.createElement("a");

      if (window.isSecureContext === false) {
        message.href = document.location.href.replace(/^http:/, "https:");
        message.innerHTML = "WEBXR NEEDS HTTPS"; // TODO Improve message
      } else {
        message.href = "https://immersiveweb.dev/";
        message.innerHTML = "WEBXR NOT AVAILABLE";
      }

      message.className = "webxr-message";

      stylizeElement(message);

      return message;
    }
  }

  /**
   * Registers a `sessiongranted` event listener. When a session is granted, the {@link VRButton#xrSessionIsGranted}
   * flag will evaluate to `true`. This method is automatically called by the module itself so there
   * should be no need to use it on app level.
   */
  static registerSessionGrantedListener() {
    if (typeof navigator !== "undefined" && "xr" in navigator) {
      // WebXRViewer (based on Firefox) has a bug where addEventListener
      // throws a silent exception and aborts execution entirely.
      if (/WebXRViewer\//i.test(navigator.userAgent)) return;

      navigator.xr.addEventListener("sessiongranted", () => {
        VRButton.xrSessionIsGranted = true;
      });
    }
  }
}

/**
 * Whether a XR session has been granted or not.
 *
 * @static
 * @type {boolean}
 * @default false
 */
VRButton.xrSessionIsGranted = false;
VRButton.registerSessionGrantedListener();

export { VRButton };
