const SEARCH_ZONES_QUERY = `
  query SearchZones {
    worldData {
      zones {
        id
        name
        encounters {
          id
          name
        }
      }
    }
  }
`;

const ENCOUNTER_BY_ID_QUERY = `
  query EncounterById($encounterId: Int!) {
    worldData {
      encounter(id: $encounterId) {
        id
        name
        zone {
          id
          name
        }
      }
    }
  }
`;

const CHARACTER_RANKINGS_QUERY = `
  query CharacterRankings(
    $encounterId: Int!
    $difficulty: Int!
    $page: Int!
    $serverRegion: String
    $className: String
    $specName: String
    $metric: CharacterRankingMetricType
  ) {
    worldData {
      encounter(id: $encounterId) {
        id
        name
        zone {
          id
          name
        }
        characterRankings(
          difficulty: $difficulty
          page: $page
          serverRegion: $serverRegion
          className: $className
          specName: $specName
          metric: $metric
        )
      }
    }
  }
`;

const REPORT_FIGHTS_QUERY = `
  query ReportFights($code: String!, $fightIds: [Int!], $translate: Boolean) {
    reportData {
      report(code: $code) {
        code
        title
        startTime
        endTime
        fights(fightIDs: $fightIds, translate: $translate) {
          id
          name
          encounterID
          difficulty
          kill
          startTime
          endTime
          enemyNPCs {
            id
            gameID
          }
          friendlyPlayers
          friendlyPets {
            id
            gameID
          }
        }
        masterData(translate: $translate) {
          abilities {
            gameID
            name
            type
          }
          actors {
            id
            gameID
            name
            type
            subType
            petOwner
          }
        }
      }
    }
  }
`;

const REPORT_PLAYER_DETAILS_QUERY = `
  query ReportPlayerDetails($code: String!, $fightIds: [Int!], $translate: Boolean, $includeCombatantInfo: Boolean) {
    reportData {
      report(code: $code) {
        playerDetails(fightIDs: $fightIds, translate: $translate, includeCombatantInfo: $includeCombatantInfo)
      }
    }
  }
`;

const REPORT_EVENTS_QUERY = `
  query ReportEvents($code: String!, $fightIds: [Int!], $dataType: EventDataType!, $startTime: Float, $endTime: Float, $hostilityType: HostilityType, $limit: Int, $translate: Boolean) {
    reportData {
      report(code: $code) {
        events(
          fightIDs: $fightIds
          dataType: $dataType
          startTime: $startTime
          endTime: $endTime
          hostilityType: $hostilityType
          limit: $limit
          translate: $translate
        ) {
          data
          nextPageTimestamp
        }
      }
    }
  }
`;

module.exports = {
  CHARACTER_RANKINGS_QUERY,
  ENCOUNTER_BY_ID_QUERY,
  REPORT_EVENTS_QUERY,
  REPORT_FIGHTS_QUERY,
  REPORT_PLAYER_DETAILS_QUERY,
  SEARCH_ZONES_QUERY
};
