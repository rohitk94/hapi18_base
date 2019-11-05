'use strict';

let saveData = function (model, data) {
    return new Promise((resolve, reject) => {
        new model(data).save((err, result) => {
            if (err) reject(err);
            else resolve(result)
        })
    })
};

let getData = function (model, query, projection, options) {
    return new Promise((resolve, reject) => {
        model.find(query, projection, options, (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    })
};

let getUniqueData = function (model, query, projection, options, keyName) {
    return new Promise((resolve, reject) => {
        model.find(query, projection, options).distinct(keyName, (err, data) => {
            if (err) reject(err);
            else resolve(data)
        });
    });

};

let findOne = function (model, query, projection, options) {
    return new Promise((resolve, reject) => {
        model.findOne(query, projection, options, function (err, data) {
            if (err) reject(err);
            resolve(data);
        });
    })
};

let findAndUpdate = function (model, conditions, update, options) {
    return new Promise((resolve, reject) => {
        model.findOneAndUpdate(conditions, update, options, function (error, result) {
            if (error) reject(error);
            else resolve(result)
        })
    });
};

let findAndUpdateWithPopulate = function (model, conditions, update, collectionOptions, options) {
    return new Promise((resolve, reject) => {
        model.findOneAndUpdate(conditions, update, options).populate(collectionOptions).exec(function (error, result) {
            if (error) reject(error);
            else resolve(result);
        })
    });
};

let update = function (model, conditions, update, options) {
    return new Promise((resolve, reject) => {
        model.update(conditions, update, options, function (err, result) {
            if (err) reject(err);
            else resolve(result)
        });
    });
};

let remove = function (model, condition) {
    return new Promise((resolve, reject) => {
        model.remove(condition, function (err, result) {
            if (err) reject(err);
            else resolve(result)
        });
    })
};
/*------------------------------------------------------------------------
 * FIND WITH REFERENCE
 * -----------------------------------------------------------------------*/
let populateData = function (model, query, projection, options, collectionOptions) {
    return new Promise((resolve, reject) => {
        model.find(query, projection, options).populate(collectionOptions).exec(function (err, result) {
            if (err) reject(err);
            else resolve(result)
        });
    });
};

let count = function (model, condition) {
    return new Promise((resolve, reject) => {
        model.count(condition, function (err, result) {
            if (err) reject(err);
            else resolve(result)
        })
    })
};
/*
 ----------------------------------------
 AGGREGATE DATA
 ----------------------------------------
 */
let aggregateData = function (model, group) {
    return new Promise((resolve, reject) => {
        model.aggregate(group, function (err, result) {
            if (err) reject(err);
            else resolve(result)
        });
    })
};

let insert = function (model, data, options) {
    return new Promise((resolve, reject) => {
        model.collection.insert(data, options, function (err, result) {
            if (err) reject(err);
            else resolve(result);
        })
    })
};

let insertMany = function (model, data, options) {
    return new Promise((resolve, reject) => {
        model.collection.insertMany(data, options, function (err, result) {
            if (err) reject(err);
            else resolve(result)
        })
    });

};

let aggregateDataWithPopulate = function (model, group, populateOptions) {
    return new Promise((resolve, reject) => {
        model.aggregate(group, (err, data) => {
            if (err) {
                reject(err)
            }
            model.populate(data, populateOptions,
                function (err, populatedDocs) {
                    if (err) reject(err);
                    else resolve(populatedDocs)// This object should now be populated accordingly.
                });
        });
    })
};

let deepPopulate = function (model, criteria, projectionQuery, options, populateModel, nestedModel) {
    return new Promise((resolve, reject) => {
        model.find(criteria, projectionQuery, options).populate(populateModel)
            .exec(function (err, docs) {
                if (err) reject(err);
                else {
                    model.populate(docs, nestedModel, function (err, populatedDocs) {
                        if (err) reject(err);
                        else resolve(populatedDocs)
                    });
                }
            });
    });

};

let bulkFindAndUpdate = function (bulk, query, update, options) {
    bulk.find(query).upsert().update(update, options);
};


module.exports = {
    saveData: saveData,
    getData: getData,
    getUniqueData: getUniqueData,
    update: update,
    remove: remove,
    insert: insert,
    insertMany: insertMany,
    count: count,
    findOne: findOne,
    findAndUpdate: findAndUpdate,
    populateData: populateData,
    aggregateData: aggregateData,
    aggregateDataWithPopulate: aggregateDataWithPopulate,
    deepPopulate: deepPopulate,
    bulkFindAndUpdate: bulkFindAndUpdate,
    findAndUpdateWithPopulate: findAndUpdateWithPopulate,
};
