export class IntOutOfRangeError extends TypeError {
  message: "Integer is out of range";
}

export class IsNotIntegerError extends TypeError {
  message: "Number is not an integer";
}

export class SeedTypeIsUnsupportedError extends TypeError {
  message: "Given seed type is not supported yet";
}

export class PluginTypeIsNotSupported extends TypeError {
  message: "Given plugin type is not supported";
}
