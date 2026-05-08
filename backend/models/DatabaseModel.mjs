import mysql from "mysql2/promise";

export class DatabaseModel{
static connection 

static{
    this.connection = mysql.createPool({
        host: "",
        user: "",
        password: "",
        database: "",
        nestTables: true,
        dateStrings: true, 
    })
}
static query(sql, values){
    return this.connection.query(sql, values)
    .then(([result]) => result)
}


static toMySqlDate(date){
    const year = date.toLocaleString("default", {year: "numeric"});
    const month = date.toLocaleString("default", {month: "2-digit"});
    const day = date.toLocaleString("default", {day: "2-digit"});

    return [year, month, day].join("-"); 
}
}