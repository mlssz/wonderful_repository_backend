let express = require("express")
let findHelp = require("../libs/find_helpers.js")
let router = express.Router()
exports.router = router
exports.path = "/"
let repository = require("../models/repository")
let material = require("../models/material")
let migration = require("../models/migration")
let task = require("../models/task")
let errorinfo = require("../models/errorinfo")
let exportinfo = require("../models/exportinfo")
let staff = require("../models/staff")
let mongoose = require("mongoose")
let ObjectId = mongoose.Types.ObjectId

router.get("/task/:id/", (req, res, next) => {
    var id = req.params.id

    return Promise.resolve()
        .then(() => task.findOne({ _id: ObjectId(id) }))
        .then(doc => {
            if (doc != null) {
                return doc.combine_migration_or_error(true)
                .then(r => res.json(r.filter(t => t)))
            } else {
                res.status(404).end()
            }
        })
        .catch(err => {
            res.status(404).end()
        })
})

router.head("/tasks", (req, res) => {
    let others = JSON.parse(req.query.others)
    others = findHelp.findByQuery(task, others)
    others.count((err, num) => {
        if (err) {
            res.status(400).json({ error: JSON.stringify(err) })
        } else {
            res.status(200).append("num", num).end()
        }
    })
})

router.get("/tasks", (req, res) => {
  let page = req.query.page ? parseInt(req.query.page) : 0
  let size = req.query.limit ? parseInt(req.query.limit) : 10
  let others = req.query.others ? req.query.others : []
  return Promise.resolve()
    .then(() => {
      let query = findHelp.findByQuery(task, others)
      query = findHelp.slicePage(page, size)

      return query
    })
    .then(ts => {
      return Promise.all(ts.map(t => t.combine_migration_or_error()))
    })
    .then(ts => res.status(200).json(ts.filter(t => t)))
    .catch(err => res.status(400).json({error: JSON.stringify(err)}))
})

router.post("/tasks", (req, res) => {
    let account = req.body.account
    staff.findOne({ account: account }, (err, doc) => {
        if (err) {
            res.status(400).json({ error: err })
        } else {
            if (doc == null) {
                res.status(400).json({ error: "用户不存在" })
            } else {
                doc = doc.toObject()
                task.count({ staff: doc._id, status: { $lt: 2 } }, (err, num) => {
                    if (err) {
                        res.status(400).json({ error: err })
                    } else {
                        if (num >= 0 && num < 10) {
                            task.find({ staff: null }, null, { limit: (10 - num) }, (err, ss) => {
                                if (err) {
                                    res.status(400).json({ error: err })
                                } else {
                                    ss = ss.toObject()
                                    task.update({ $in: ss }, { staff: doc._id }, (err) => {
                                        if (err) {
                                            res.status(400).json({ error: err })
                                        } else {
                                            // res.
                                        }
                                    })
                                }
                            })
                        } else {
                            res.status(400).json({ error: "不能添加新的任务了，快去完成你已接的任务吧" })
                        }
                    }
                })
            }
        }
    })
})

router.patch("/error/task/:id", (req, res) => {
    let id = req.params.id
    task.findOne({ _id: ObjectId(id) }, (err, doc) => {
        if (err) {
            res.status(400).json({ error: err })
        } else {
            if (doc == null) {
                res.status(400).json({ error: "任务不存在" })
            } else {
                doc = doc.toObject()
                if (doc.error != null) {
                    task.update({ _id: ObjectId(id) }, { end_time: Date.now(), status: 2 }, (err, raw) => {
                        if (err) {
                            res.status(400).json({ error: err })
                        } else {
                            res.status(200).json({})
                        }
                    })
                } else {
                    res.status(400).json({ error: "该任务不是错误修复任务" })
                }
            }
        }
    })
})

router.patch("/staff/:sid/task/:id", (req, res) => {
    let sid = req.params.sid
    let id = req.params.id
    task.findOne({ _id: ObjectId(id) }, (err, doc) => {
        if (err) {
            res.status(400).json({ error: err })
        } else {
            if (doc == null) {
                res.status(400).json({ error: "任务不存在" })
            } else {
                doc = doc.toObject()
                if ((doc.staff + '') == sid) {
                    task.updateOne({ _id: ObjectId(id) }, { start_time: Date.now(), status: 1 }, (err, raw) => {
                        if (err) {
                            res.status(400).json({ error: err })
                        } else {
                            res.status(200).json({})
                        }
                    })
                } else {
                    res.status(400).json({ error: "这不是你的任务" })
                }
            }
        }
    })
})

router.delete("/staff/:sid/tasks", (req, res) => {
    let sid = req.params.sid
    task.find({ staff: ObjectId(sid), status: { $lt: 2 } }, (err, doc) => {
        if (err) {
            res.status(400).json({ error: err })
        } else {
            if (doc == null || doc.length < 1) {
                res.status(200).json({})
            } else {
                doc = doc.toObject()
                let r = []
                for (let i in doc) {
                    r.push(doc[i]._id)
                }
                task.update({ $in: r }, { $set: { status: 0, staff: null } }, (err, raw) => {
                    if (err) {
                        res.status(400).json({ error: err })
                    } else {
                        res.status(200).json(raw)
                    }
                })
            }
        }
    })
})

router.patch("/staff/:sid/tasks", (req, res) => {
    let sid = req.params.sid
    let repository = req.body.repository
    let location = req.body.location

})

router.head("/staff/:sid/tasks", (req, res) => {
    let sid = req.params.sid
    let others = req.query.others
    others == null ? others = [] : others
    let query = { staff: ObjectId(sid) }
    for (let i in others) {
        if (ohters[i].key && (typeof ohters[i].key === "string")) {
            if (ohters[i].value) {
                query[ohters[i].key] = ohters[i].value
            } else {
                if (ohters[i].region) {
                    query[ohters[i].key] = ohters[i].region
                } else {
                    continue
                }
            }
        } else {
            continue
        }
    }
    task.count(query, (err, num) => {
        if (err) {
            res.status(400).json({ error: JSON.stringify(err) })
        } else {
            res.status(200).append("num", num).end()
        }
    })
})

router.get("/staff/:sid/tasks", (req, res) => {
  let sid = req.params.sid
  let page = req.query.page ? parseInt(req.query.page) : 0
  let size = req.query.limit ? parseInt(req.query.limit) : 10
  let others = req.query.others ? req.query.others : []

  return Promise.resolve()
    .then(() => staff.findOne({_id: ObjectId(sid)}))
    .then((s) => {
      if(s === null ) return res.status(404).end()

      others.push({
        staff: ObjectId(sid)
      })

      return Promise.resolve()
        .then(() => {
          let query = findHelp.findByQuery(task, others)
          query = findHelp.slicePage(page, size)

          return query
        })
        .then(ts => {
          return Promise.all(ts.map(t => t.combine_migration_or_error()))
        })
        .then(ts => res.status(200).json(ts.filter(t => t)))
        .catch(err => res.status(400).json({error: JSON.stringify(err)}))
    })
    .catch(() => res.status(404).end())
})

router.get("/migration/:id/task", (req, res) => {
    let id = req.params.id

    return Promise.resolve()
        .then(() => migration.findOne({ _id: ObjectId(id) }))
        .then(doc => {
            if (doc != null) {
                return task.findOne({ migration: ObjectId(id) })
            } else {
                throw "Not Found Migration"
            }
        })
        .then(doc => {
            if (doc != null) {
                return doc.combine_migration_or_error(true)
            } else {
                throw "Not Found Task"
            }
        })
        .then(r => res.json(r.filter(t => t)))
        .catch(() => {
            res.status(404).end()
        })
})

router.post("/staff/:sid/tasks", (req, res) => {
    let sid = req.params.sid
    let action = req.body.action
    let maxtask = 10
    let query = {
        staff: null,
        status: 0
    }
    if (action) {
        action = parseInt(req.body.action)
        if (action < 600) {
            query["action"] = action
        } else {
            query["action"] = { $gte: 600 }
        }
    }
    task.count({ staff: ObjectId(sid), status: { $lt: 2 } }, (err, count) => {
        if (err) {
            res.status(400).json({ error: err })
        } else {
            if ((maxtask - count) > 0) {
                task.find(query, null, { limit: (maxtask - count) }, (err, ts) => {
                    if (err) {
                        res.status(400).json({ error: err })
                    } else {
                        // res.status(200).json(tsid)
                        let miid = []
                        let eiid = []
                        let taid = []
                        let maid = []
                        let tsobj = []
                        for (let i in ts) {
                            tsobj.push(ts[i].toObject())
                            taid.push(ts[i]._id)
                            if (ts[i].migration) {
                                miid.push(ts[i].migration)
                            } else if (ts[i].error) {
                                eiid.push(error)
                            } else { }
                        }
                        let p = new Promise((resolve, reject) => {
                            // migration.find({_id:{$in:miid}},(err, miobj)=>{})
                            task.update({ _id: { $in: taid } }, { staff: ObjectId(sid) }, (err, raw) => {
                                if (err) {
                                    res.status(400).json({ error: err })
                                } else {
                                    resolve()
                                }
                            })
                        })
                        p.then(() => {
                            return new Promise((resolve, reject) => {
                                migration.find({ _id: { $in: miid } }, (err, obj) => {
                                    if (err) {
                                        resolve(err)
                                    } else {
                                        for (let i in obj) {
                                            for (let j in ts) {
                                                if ((ts[j].migration + '') == (obj[i]._id + '')) {
                                                    tsobj[j].migration = obj[j]
                                                    break;
                                                }
                                            }
                                            maid.push(obj[i].material)
                                        }
                                        resolve()
                                    }
                                })
                            })
                        }).then(() => {
                            return new Promise((resolve, reject) => {
                                errorinfo.find({ _id: { $in: eiid } }, (err, obj) => {
                                    if (err) {
                                        resolve(err)
                                    } else {
                                        for (let i in obj) {
                                            for (let j in ts) {
                                                if ((ts[j].errorinfo + '') == (obj[i]._id + '')) {
                                                    tsobj[j].errorinfo = obj[j]
                                                    break;
                                                }
                                            }
                                            maid.push(obj[i].material)
                                        }
                                        resolve()
                                    }
                                })
                            })
                        }).then(() => {
                            material.find({ _id: { $in: maid } }, (err, obj) => {
                                if (err) {
                                    resolve(err)
                                } else {
                                    for (let i in obj) {
                                        for (let j in tsobj) {
                                            if (ts[j].migration) {
                                                if ((tsobj[j].migration.material + '') == (obj[i]._id + '')) {
                                                    tsobj[j].material = obj[i].toObject()
                                                    break
                                                }
                                            } else {
                                                if ((tsobj[j].errorinfo.material + '') == (obj[i]._id + '')) {
                                                    tsobj[j].material = obj[i].toObject()
                                                    break
                                                }
                                            }
                                        }
                                    }
                                    res.status(200).json(tsobj)
                                }
                            })
                        }).catch((err) => {
                            res.status(400).json({ error: err })
                        })
                    }
                })
            } else {
                res.status(400).json({ error: "最大任务数量：" + maxtask + "个" })
            }
        }
    })
})
