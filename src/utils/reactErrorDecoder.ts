const ERROR_TEMPLATES: Record<string, (args: string[]) => string> = {
  "31": (args) => {
    const found = args[0] ?? "an unknown value";
    return [
      "Objects are not valid as a React child.",
      `React received ${found}.`,
      "This usually means that some component tried to render an object or element reference instead of primitive text or a valid JSX tree.",
      "Check any render functions that return data from APIs or smart contracts and ensure they convert values to strings, numbers, or React nodes before rendering.",
    ].join(" ");
  },
};

export interface DecodedReactError {
  code: string;
  message: string;
  helpUrl: string;
  args: string[];
}

const REACT_ERROR_REGEX = /Minified React error #(\d+); visit (https?:\/\/[^\s]+) for the full message/;
const ARG_REGEX = /args\[]=(?<arg>[^&#]+)/g;

export const decodeReactError = (error: unknown): DecodedReactError | null => {
  if (!error) {
    return null;
  }

  const message = typeof error === "string" ? error : error instanceof Error ? error.message : String(error);
  const match = message.match(REACT_ERROR_REGEX);

  if (!match) {
    return null;
  }

  const [, code, helpUrl] = match;
  const args: string[] = [];

  if (helpUrl) {
    try {
      const url = new URL(helpUrl);
      const matches = url.href.matchAll(ARG_REGEX);

      for (const argMatch of matches) {
        const value = argMatch.groups?.arg;
        if (value) {
          args.push(decodeURIComponent(value));
        }
      }
    } catch (parseError) {
      console.warn("Failed to parse React error decoder URL:", parseError);
    }
  }

  const template = ERROR_TEMPLATES[code];
  const decodedMessage = template ? template(args) : null;

  if (!decodedMessage) {
    return {
      code,
      message: "React encountered a production-only error. Open the linked decoder URL for details.",
      helpUrl,
      args,
    };
  }

  return {
    code,
    message: decodedMessage,
    helpUrl,
    args,
  };
};
