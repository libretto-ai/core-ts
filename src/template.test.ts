import {
  f,
  formatTemplate,
  getTemplateVariables,
  objectTemplate,
} from "./template";

describe("templating", () => {
  describe("f", () => {
    it("should extract variables", () => {
      expect(getTemplateVariables(f`{a} {b} {c}`)).toEqual(["a", "b", "c"]);
    });

    it("Should throw an error when using variables in a template string", () => {
      const a = "a";
      const b = "b";
      const c = "c";
      expect(() => getTemplateVariables(f`${a} ${b} ${c}`)).toThrow(
        "No inline variables",
      );
    });

    it("Should format to a string", () => {
      expect(
        formatTemplate(f`{a} {b} {c}`, { a: "A", b: "B", c: "C" }),
      ).toEqual("A B C");
    });

    it("Should throw an error if any variable is missing during formatting", () => {
      expect(() => formatTemplate(f`{a} {b} {c}`, { a: "A", c: "C" })).toThrow(
        "missing variable",
      );
    });
  });

  describe("objTemplate", () => {
    it("should extract variables from objects", () => {
      expect(
        getTemplateVariables(
          objectTemplate({ a: "A here: {a}", b: "B here: {b}" }),
        ),
      ).toEqual(["a", "b"]);
    });

    it("should extract variables from nested objects", () => {
      expect(
        getTemplateVariables(
          objectTemplate({
            a: "A here: {a}",
            b: "B here: {b}",
            c: { d: "D here: {d}", e: "E here: {e}" },
          }),
        ),
      ).toEqual(["a", "b", "d", "e"]);
    });

    it("should extract variables from arrays", () => {
      expect(
        getTemplateVariables(objectTemplate(["A here: {a}", "B here: {b}"])),
      ).toEqual(["a", "b"]);
    });

    it("Should handle nulls, undefined, and numbers in variable extraction", () => {
      expect(
        getTemplateVariables(
          objectTemplate({
            a: "A here: {a}",
            b: "B here: {b}",
            c: { d: "D here: {d}", e: "E here: {e}" },
            f: null,
            g: undefined,
            h: 1,
          }),
        ),
      ).toEqual(["a", "b", "d", "e"]);
    });

    it("Should format a chat template", () => {
      expect(
        formatTemplate(
          objectTemplate([
            {
              role: "system",
              content:
                "You will be asked for travel recomendations by a {role}. Answer as you were a travel guide and give no more than {quantity} recommendation options per answer. Just answer with the options and don't give any introduction. Use markdown to format your response.",
            },
            {
              role: "user",
              content: "Where can I eat {food} in {city}?",
            },
          ]),
          {
            role: "tourist",
            quantity: 3,
            food: "pizza",
            city: "Rome",
          },
        ),
      ).toEqual([
        {
          role: "system",
          content:
            "You will be asked for travel recomendations by a tourist. Answer as you were a travel guide and give no more than 3 recommendation options per answer. Just answer with the options and don't give any introduction. Use markdown to format your response.",
        },
        {
          role: "user",
          content: "Where can I eat pizza in Rome?",
        },
      ]);
    });

    it("Should format a chat template with a chat history role", () => {
      expect(
        formatTemplate(
          objectTemplate([
            {
              role: "system",
              content:
                "You are a helpful assistant who guides executives on how to manage employees.",
            },
            {
              role: "chat_history",
              content: "{prev_messages} {second_history}",
            },
            {
              role: "user",
              content: "{question}",
            },
          ]),
          {
            prev_messages: [
              {
                role: "user",
                content: "You are always late to work.",
              },
              {
                role: "assistant",
                content: "I suggest you to be more polite.",
              },
            ],
            second_history: [
              {
                role: "user",
                content: "Is there something going on that makes you late?",
              },
              {
                role: "assistant",
                content: "That's a little better.",
              },
            ],
            question: "Why are you being so short with me?",
          },
        ),
      ).toEqual([
        {
          role: "system",
          content:
            "You are a helpful assistant who guides executives on how to manage employees.",
        },
        {
          role: "user",
          content: "You are always late to work.",
        },
        {
          role: "assistant",
          content: "I suggest you to be more polite.",
        },
        {
          role: "user",
          content: "Is there something going on that makes you late?",
        },
        {
          role: "assistant",
          content: "That's a little better.",
        },
        {
          role: "user",
          content: "Why are you being so short with me?",
        },
      ]);
    });

    it("Should unescape escaped variable references", () => {
      expect(
        formatTemplate(
          objectTemplate({
            a: "A here: \\{a\\}",
            b: "B here: \\{b\\}",
            c: { d: "D here: \\{d\\}", e: "E here: \\{e\\}" },
          }),
          {},
        ),
      ).toEqual({
        a: "A here: {a}",
        b: "B here: {b}",
        c: { d: "D here: {d}", e: "E here: {e}" },
      });
    });
    it("Should allow mixing of escaped and unescaped variable references", () => {
      expect(
        formatTemplate(
          objectTemplate({
            a: "A here: \\{a\\} but this is the value of a: {a}",
            b: "B here: \\{b\\}",
            c: { d: "D here: \\{d\\}", e: "E here: \\{e\\}" },
          }),
          { a: "Heya" },
        ),
      ).toEqual({
        a: "A here: {a} but this is the value of a: Heya",
        b: "B here: {b}",
        c: { d: "D here: {d}", e: "E here: {e}" },
      });
    });
  });
});
