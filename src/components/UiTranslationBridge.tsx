import { useEffect } from "react";
import { useI18n } from "../i18n/I18nContext";
import { translateUiText } from "../i18n/uiTranslations";

const TRANSLATABLE_ATTRIBUTES = [
  "placeholder",
  "title",
  "aria-label",
  "aria-description"
] as const;

const originalText = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

function isIgnored(node: Node): boolean {
  const element =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;

  return Boolean(
    element?.closest(
      "script, style, code, pre, [data-i18n-ignore='true'], [contenteditable='true'], .compact-system-title, .archont-system-title, .archont-player-identity > strong, .archont-session-identity > h2, [class*='session-name-value'], [class*='custom-name']"
    )
  );
}

function rememberAttribute(element: Element, attribute: string, value: string) {
  let attributes = originalAttributes.get(element);

  if (!attributes) {
    attributes = new Map<string, string>();
    originalAttributes.set(element, attributes);
  }

  if (!attributes.has(attribute)) {
    attributes.set(attribute, value);
  }
}

function translateTextNode(node: Text, language: "en" | "ru") {
  if (isIgnored(node)) {
    return;
  }

  if (language === "en") {
    const original = originalText.get(node);

    if (original !== undefined && node.data !== original) {
      node.data = original;
    }

    return;
  }

  const current = node.data;
  const translated = translateUiText(current, language);

  if (translated !== current) {
    originalText.set(node, current);
    node.data = translated;
  }
}

function translateElementAttributes(element: Element, language: "en" | "ru") {
  if (isIgnored(element)) {
    return;
  }

  for (const attribute of TRANSLATABLE_ATTRIBUTES) {
    const current = element.getAttribute(attribute);

    if (current === null) {
      continue;
    }

    if (language === "en") {
      const original = originalAttributes.get(element)?.get(attribute);

      if (original !== undefined && current !== original) {
        element.setAttribute(attribute, original);
      }

      continue;
    }

    const translated = translateUiText(current, language);

    if (translated !== current) {
      rememberAttribute(element, attribute, current);
      element.setAttribute(attribute, translated);
    }
  }
}

function translateTree(root: Node, language: "en" | "ru") {
  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root as Text, language);
    return;
  }

  if (root.nodeType === Node.ELEMENT_NODE) {
    translateElementAttributes(root as Element, language);
  }

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
  );

  let currentNode = walker.nextNode();

  while (currentNode) {
    if (currentNode.nodeType === Node.TEXT_NODE) {
      translateTextNode(currentNode as Text, language);
    } else {
      translateElementAttributes(currentNode as Element, language);
    }

    currentNode = walker.nextNode();
  }
}

export default function UiTranslationBridge() {
  const { language } = useI18n();

  useEffect(() => {
    let applying = false;

    const apply = (root: Node = document.body) => {
      if (applying) {
        return;
      }

      applying = true;

      try {
        translateTree(root, language);
      } finally {
        applying = false;
      }
    };

    apply();

    const observer = new MutationObserver((mutations) => {
      if (applying) {
        return;
      }

      for (const mutation of mutations) {
        if (mutation.type === "characterData") {
          apply(mutation.target);
          continue;
        }

        if (mutation.type === "attributes") {
          apply(mutation.target);
          continue;
        }

        mutation.addedNodes.forEach((node) => apply(node));
      }
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATABLE_ATTRIBUTES]
    });

    return () => observer.disconnect();
  }, [language]);

  return null;
}
