let lastUrl = location.href;
let isProcessing = false;

async function CopyTagsToClipboard(e) {

   try {
      let button = e.currentTarget;
      let childs = button.children;

      await navigator.clipboard.writeText(childs[0].textContent + childs[1].textContent)
         .then(() => {
            DisplayCopyFeedback(button, e.offsetX);
         });

   } catch (e) {
      console.error("Error copying text to clipboard: ", e);
   }
}

function DisplayCopyFeedback(button, offsetX) {

   try {
      //Stop multiples from existing
      let extantOverlay = button.querySelector('[data-role="copied-overlay"]');
      if (extantOverlay) extantOverlay.remove();

      let spanElement = document.createElement("span");

      let textColor = getComputedStyle(document.querySelector("#description.ytd-watch-metadata")).color;

      spanElement.dataset.role = "copied-overlay";
      spanElement.style.position = "absolute";
      spanElement.textContent = "Copied!";
      spanElement.style.pointerEvents = "none";
      spanElement.style.color = textColor;
      spanElement.style.fontSize = "1.5rem";
      spanElement.style.top = "-0.75em";
      spanElement.style.left = offsetX + "px";

      let displayTime = 1750;

      //Animate position
      let animation = spanElement.animate([
         { transform: 'translate(-50%, 0)', easing: 'ease', offset: 0.0 },
         { transform: 'translate(-50%, -0.5em)', offset: 0.75 },
         { transform: 'translate(-50%, -0.5em)', offset: 1.0 }
      ], {
         duration: displayTime, fill: "forwards"
      });

      //Animate opacity
      spanElement.animate([
         { opacity: 0, easing: 'ease' },
         { opacity: 1, easing: 'ease', offset: 0.1 },
         { opacity: 1, easing: 'ease', offset: 0.7 },
         { opacity: 0, offset: 1.0 }
      ], {
         duration: displayTime, fill: "forwards"
      });

      //Remove element once the animation is completed
      animation.finished.then(() => spanElement.remove());

      button.appendChild(spanElement);

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
         return null;

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

   let commentsElement = document.querySelector("#comments");
   if (!commentsElement) return;

   if (commentsElement.previousElementSibling?.dataset?.grabTagsBtn) {
      //Button exists, but update it if URL has changed

      if (location.href !== lastUrl) {
         lastUrl = location.href;

         try {
            isProcessing = true;

            let tags = await FetchTags();

            commentsElement.previousElementSibling.children[0].textContent = tags ? "Tags: " : "";
            commentsElement.previousElementSibling.children[1].textContent = tags ?? "No tags :(";

         } catch (e) { }
         finally {
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
         let tags = await FetchTags();

         let labelSpanElement = document.createElement("span");
         labelSpanElement.textContent = tags ? "Tags: " : "";
         labelSpanElement.style.pointerEvents = "none";

         let tagsSpanElement = document.createElement("span");
         tagsSpanElement.textContent = tags ?? "No tags :(";
         tagsSpanElement.style.textAlign = "left";
         tagsSpanElement.style.pointerEvents = "none";

         buttonElement.appendChild(labelSpanElement);
         buttonElement.appendChild(tagsSpanElement);

         //Grabbing some colors from YouTube
         let descriptionElement = document.querySelector("#description.ytd-watch-metadata");
         let descriptionComputedStyle = getComputedStyle(descriptionElement);

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

         commentsElement.insertAdjacentElement("beforebegin", buttonElement);

      } catch (e) { }
      finally {
         isProcessing = false;
      }
   }
}

let observer = new MutationObserver(() => { InsertTagsButton() });

observer.observe(document.body, { childList: true, subtree: true });
