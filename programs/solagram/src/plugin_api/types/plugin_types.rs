use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Debug, Clone, Copy, Default)]
pub enum PluginTypes {
  #[default]
  Communication,
  Token,
  Application,
}

impl std::fmt::Display for PluginTypes {
  fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
      let s = match self {
          PluginTypes::Communication => "communication",
          PluginTypes::Token => "token",
          PluginTypes::Application => "application",
      };
      write!(f, "{s}")
  }
}
