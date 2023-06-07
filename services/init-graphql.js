const {buildSchema} = require('graphql');
const {createHandler} = require("graphql-http/lib/use/express");
const {DataInterface} = require("./data-interface");
const {MongoQueries} = require("../crdc-datahub-database-drivers/mongo-queries");
const config = require("../config");

//Read schema from schema.graphql file
const schema = buildSchema(require("fs").readFileSync("graphql/schema.graphql", "utf8"));
const dbService = new MongoQueries(config.mongo_db_connection_string)
const dataInterface = new DataInterface(dbService);
//Query logic
const root = {
    submitApplication: dataInterface.submitApplication.bind(dataInterface),
    approveApplication: dataInterface.approveApplication.bind(dataInterface),
    rejectApplication: dataInterface.rejectApplication.bind(dataInterface),
    reopenApplication: dataInterface.reopenApplication.bind(dataInterface),
    deleteApplication: dataInterface.deleteApplication.bind(dataInterface)
};

module.exports = (req, res) => {
    createHandler({
        schema: schema,
        rootValue: root,
        context: req.session
    })(req,res);
}
