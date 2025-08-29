import * as constants from "../constants";

import * as error from "../../../error";

export type PluginType = "communication" | "token" | "application";

export function getPluginListSeedKey(pluginType: PluginType): String {
  switch (pluginType) {
    case "communication": return constants.COMMUNICATION_PLUGIN_LIST_STATE_SEED_KEY;
    case "token": return constants.TOKEN_PLUGIN_LIST_STATE_SEED_KEY;
    case "application": return constants.APPLICATION_PLUGIN_LIST_STATE_SEED_KEY;

    default: throw new error.PluginTypeIsNotSupported();
  }
}
