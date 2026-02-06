export const getGameMetadata = `
  query GetGameMetadata($PK: String!) {
    getGameMetadata(PK: $PK) {
      PK
      SK
      date
      permalink
      home
      away
      home_pts
      away_pts
      team_ids
    }
  }
`;

export const getGamePlayers = `
  query GetGamePlayers($PK: String!) {
    getGamePlayers(PK: $PK) {
      PK
      SK
      player_name
      date
      minutes
      points
      plusminus
      assists
      rebounds
      steals
      blocks
      efg
      ts
      sentiment
      mentions
    }
  }
`;

export const getPlayerHistory = `
  query GetPlayerHistory($player_name: String!, $limit: Int) {
    getPlayerHistory(player_name: $player_name, limit: $limit) {
      PK
      SK
      player_name
      date
      minutes
      points
      plusminus
      assists
      rebounds
      steals
      blocks
      fga
      fgm
      fta
      ftm
      fg3a
      fg3m
      efg
      ts
      sentiment
      mentions
    }
  }
`;

export const listGames = `
  query ListGames {
    listGames {
      PK
      SK
      date
      permalink
      home
      away
      home_pts
      away_pts
      team_ids
    }
  }
`;

export const listSeasonStats = `
  query ListSeasonStats($limit: Int) {
    listSeasonStats(limit: $limit) {
      PK
      SK
      player_name
      date
      minutes
      points
      plusminus
      assists
      rebounds
      steals
      blocks
      fga
      fgm
      fta
      ftm
      fg3a
      fg3m
      efg
      ts
      sentiment
      mentions
    }
  }
`;