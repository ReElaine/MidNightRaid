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

const FIGHT_RANKINGS_QUERY = `
  query FightRankings($encounterId: Int!, $difficulty: Int!, $page: Int!) {
    worldData {
      encounter(id: $encounterId) {
        id
        name
        zone {
          id
          name
        }
        fightRankings(difficulty: $difficulty, page: $page)
      }
    }
  }
`;

const REPORT_FIGHTS_QUERY = `
  query ReportFights($code: String!, $fightIds: [Int!]) {
    reportData {
      report(code: $code) {
        code
        title
        startTime
        endTime
        fights(fightIDs: $fightIds) {
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
        masterData {
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

const REPORT_EVENTS_QUERY = `
  query ReportEvents($code: String!, $fightIds: [Int!], $dataType: EventDataType!, $startTime: Float, $endTime: Float, $hostilityType: HostilityType, $limit: Int) {
    reportData {
      report(code: $code) {
        events(
          fightIDs: $fightIds
          dataType: $dataType
          startTime: $startTime
          endTime: $endTime
          hostilityType: $hostilityType
          limit: $limit
        ) {
          data
          nextPageTimestamp
        }
      }
    }
  }
`;

module.exports = {
  ENCOUNTER_BY_ID_QUERY,
  FIGHT_RANKINGS_QUERY,
  REPORT_EVENTS_QUERY,
  REPORT_FIGHTS_QUERY,
  SEARCH_ZONES_QUERY
};
