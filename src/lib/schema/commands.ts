// tslint:disable:no-object-literal-type-assertion

import { Schema } from "jsonschema";
import { alphanumericExtendedPattern } from "./";
import { ArgDefinition, argsSchema } from "./args";
import { ExecFunction, ExecUtils } from "./runtime";

export interface Command {
  desc?: string;
  args?: {
    [argName: string]: ArgDefinition;
  };
  internal?: boolean;
  run(exec: ExecFunction, args: object, utils: ExecUtils): void;
}

export const commandSchema: Schema = {
  id: "/command",
  type: "object",
  required: ["run"],
  properties: {
    desc: {
      type: "string"
    },
    args: argsSchema,
    run: {
      isFunction: true
    } as Schema,
    internal: {
      type: "boolean"
    }
  },
  additionalProperties: false
};

export interface Commands {
  [commandName: string]: Command;
}

export const commandsSchema: Schema = {
  id: "/commands",
  type: "object",
  patternProperties: {
    [alphanumericExtendedPattern]: commandSchema
  },
  additionalProperties: false
};
