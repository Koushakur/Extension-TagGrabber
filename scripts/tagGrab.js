let lastUrl = location.href;
let isProcessing = false;

async function CopyTagsToClipboard(e) {

   try {
      let button = e.currentTarget;
      let childs = button.children;

      await navigator.clipboard.writeText(childs[0].textContent + childs[1].textContent)
         .then(() => {
            DisplayCopyFeedback(button);
         });

   } catch (e) {
      console.error("Error copying text to clipboard: ", e);
   }
}

function DisplayCopyFeedback(button) {

   try {
      //Stop multiples from existing
      let extantOverlay = button.querySelector('[data-role="copied-overlay"]');
      if (extantOverlay) extantOverlay.remove();

      let checkmarkElem = document.createElement("span");

      let textColor = getComputedStyle(document.querySelector("#description.ytd-watch-metadata")).color;

      checkmarkElem.dataset.role = "copied-overlay";
      checkmarkElem.style.position = "absolute";
      checkmarkElem.textContent = "Copied!";
      checkmarkElem.style.pointerEvents = "none";
      checkmarkElem.style.color = textColor;
      checkmarkElem.style.fontSize = "1.5rem";
      checkmarkElem.style.top = "-0.75em";
      checkmarkElem.style.left = "50%";

      let displayTime = 1750;

      //Animate position
      let animation = checkmarkElem.animate([
         { transform: 'translate(-50%, 0)', easing: 'ease', offset: 0.0 },
         { transform: 'translate(-50%, -0.5em)', offset: 0.75 },
         { transform: 'translate(-50%, -0.5em)', offset: 1.0 }
      ], {
         duration: displayTime, fill: "forwards"
      });

      //Animate opacity
      checkmarkElem.animate([
         { opacity: 0, easing: 'ease' },
         { opacity: 1, easing: 'ease', offset: 0.1 },
         { opacity: 1, easing: 'ease', offset: 0.7 },
         { opacity: 0, offset: 1.0 }
      ], {
         duration: displayTime, fill: "forwards"
      });
      animation.finished.then(() => checkmarkElem.remove());

      button.appendChild(checkmarkElem);

   } catch (e) {
      console.error("Error displaying copy feedback: ", e);
   }
}

async function FetchTags() {

   try {

      let res = await fetch(location.href);
      let html = await res.text();
      let match = html.match(/<meta itemprop="keywords" content="([^"]*)"/);

      if (match) {
         var htmlDecoder = document.createElement("textarea");
         htmlDecoder.innerHTML = match[1];

         return htmlDecoder.value.replaceAll(",", ", ");

      } else
         return "No tags :(";

   } catch (e) {
      console.error("Error fetching tags: ", e);
   }
}

//Used for support for the custom theme "YouTube-DeepDark" that doesn't use "--yt-saturated-raised-background"
function ThemeIsActive() {
   try {
      let mainColor = getComputedStyle(document.documentElement).getPropertyValue("--main-color").trim();
      return [mainColor !== "", mainColor];

   } catch (e) {
      return [false, ""];
   }
}

function GrabRaisedBackgroundColor(element) {
   return getComputedStyle(element).getPropertyValue("--yt-saturated-raised-background").trim();
}

async function InsertTagsButton() {
   if (isProcessing || !location.pathname.startsWith("/watch")) return;

   let commentsElem = document.querySelector("#comments");
   if (!commentsElem) return;

   if (commentsElem.previousElementSibling?.dataset?.grabTagsBtn) {
      //Button exists, but update it if URL has changed

      if (location.href !== lastUrl) {
         lastUrl = location.href;

         try {
            isProcessing = true;

            commentsElem.previousElementSibling.children[1].textContent = await FetchTags();

         } finally {
            isProcessing = false;
         }
      }

   } else {
      //Button doesn't exist, create it

      try {
         isProcessing = true;

         let buttonElement = document.createElement("button");

         buttonElement.onclick = CopyTagsToClipboard;

         buttonElement.style.cursor = "pointer";
         buttonElement.style.position = "relative";

         buttonElement.style.display = "inline-flex";
         buttonElement.style.gap = "5px";

         //Text content spans
         let labelSpan = document.createElement("span");
         labelSpan.textContent = "Tags: ";

         let tagsSpan = document.createElement("span");
         tagsSpan.textContent = await FetchTags();
         tagsSpan.style.textAlign = "left";

         buttonElement.appendChild(labelSpan);
         buttonElement.appendChild(tagsSpan);

         //Grabbing some colors from YouTube
         let descriptionElem = document.querySelector("#description.ytd-watch-metadata");
         let descriptionComputedStyle = getComputedStyle(descriptionElem);

         buttonElement.style.background = descriptionComputedStyle.backgroundColor;
         buttonElement.style.color = descriptionComputedStyle.color;

         //Font
         let fontLink = document.createElement("link");
         fontLink.rel = "stylesheet";
         fontLink.href = "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@500&display=swap";
         document.head.appendChild(fontLink);

         buttonElement.style.fontFamily = '"Atkinson Hyperlegible Next", sans-serif';
         buttonElement.style.fontWeight = "500";
         buttonElement.style.fontSize = "1.3rem";

         //General styling
         buttonElement.style.borderStyle = "none";
         buttonElement.style.borderRadius = "12px";
         buttonElement.style.padding = "8px";
         buttonElement.style.marginTop = "-10px";
         buttonElement.style.marginBottom = "-10px";

         buttonElement.dataset.grabTagsBtn = "true";

         let [themeActive, themeColor] = ThemeIsActive();
         let metadataElement = document.querySelector("ytd-watch-metadata.watch-active-metadata");

         //Hover effect
         buttonElement.addEventListener("mouseenter", (event) => {
            if (themeActive)
               event.currentTarget.style.color = themeColor;

            else
               event.currentTarget.style.backgroundColor = GrabRaisedBackgroundColor(metadataElement);

         });

         buttonElement.addEventListener("mouseleave", (event) => {
            if (themeActive)
               event.currentTarget.style.color = descriptionComputedStyle.color;

            else
               event.currentTarget.style.backgroundColor = descriptionComputedStyle.backgroundColor;
         });
         //----

         commentsElem.insertAdjacentElement("beforebegin", buttonElement);

      } catch (e) { }
      finally {
         isProcessing = false;
      }
   }
}

let observer = new MutationObserver(() => { InsertTagsButton() });

observer.observe(document.body, { childList: true, subtree: true });
