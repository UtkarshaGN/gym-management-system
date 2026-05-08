import { DatabaseModel } from "./DatabaseModel.mjs";
import { ActivityModel } from "./ActivityModel.mjs";
import { SessionModel } from "./SessionModel.mjs";


export class ActivitySessionModel extends DatabaseModel {
    constructor(activity, session){
        super();
        this.activity = activity;
        this.session = session;
    }

    static tableToModel(row){
        return new ActivitySessionModel(
            ActivityModel.tableToModel(row.activities),
            SessionModel.tableToModel(row.sessions)
        );
    }

    static getByStartAndEndDate(startDate, endDate) {
    return this.query(
        `
        SELECT * FROM activities
        INNER JOIN sessions ON activities.activity_id = sessions.activity_id
        INNER JOIN locations ON sessions.location_id = locations.location_id
        WHERE sessions.session_date BETWEEN ? AND ?
        `,
        [startDate, endDate]
    ).then(results =>
        results.map(row => this.tableToModel(row))
    );
    }
    

      
}

