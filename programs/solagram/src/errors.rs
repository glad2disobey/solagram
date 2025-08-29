use anchor_lang::prelude::*;

#[error_code]
pub enum SolagramError {
    #[msg("Unauthorized access")]
    Unauthorized,

    #[msg("Profile name too long")]
    ProfileNameTooLong,

    #[msg("Insufficient funds")]
    InsufficientFunds,

    #[msg("Plugin is already installed")]
    PluginAlreadyInstalled,
    #[msg("Unable to install plugin, limit exceeded")]
    PluginLimitExceeded,
    #[msg("Plugin type is not supported")]
    PluginUnsupported,
}
