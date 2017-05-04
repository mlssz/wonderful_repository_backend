let express = require("express")
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

router.head("/tasks", (req, res) => {
    let others = req.query.others
    others == null ? others = [] : others
    let query = {}
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

router.get("/tasks", (req, res) => {
    var page = parseInt(req.query.page)
    var size = parseInt(req.query.limit)
    var query = req.query.others
    if (query == null) {
        task.find({}, null, { limit: size, skip: size * page }, (err, docs) => {
            if (err) {
                res.status(400).json({ error: JSON.stringify(err) })
            } else {
                if (docs == null || docs.length < 1) {
                    res.status(400).json({ error: "没有找到相关记录" })
                } else {
                    res.status(200).json(docs)
                }
            }
        })
    } else {
        query = findHelp.findByQuery(task, query);
        query = findHelp.slicePage(query, page, size)
        query.exec().then((result) => {
            if (result == null || result.length < 1) {
                res.status(400).json({ error: "没有找到记录" })
            } else {
                res.status(200).json(result)
            }
        }).catch((err) => {
            res.status(400).json({ error: JSON.stringify(err) })
        })
    }
})

function combineTasks(task) {
    let _id = task._id

}

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
    let page = parseInt(req.query.page)
    let size = parseInt(req.query.limit)
    let others = req.query.others
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
    task.aggregate(

    )
})

router.get("/migration/:id/task", (req, res) => {
    let id = req.params.id
    migration.findOne({ _id: ObjectId(id) }, (err, m) => {
        if (err) {
            res.status(400).json({ error: err })
        } else {
            if (m == null) {
                res.status(400).json({ error: "找不到对象" })
            } else {
                m = m.toObject()
                material.findOne({ _id: m.material }, (err, mm) => {
                    if (err) {
                        res.status(400).json({ error: err })
                    } else {
                        if (mm == null) {
                            res.status(400).json({ error: "找不到对象" })
                        } else {
                            mm = mm.toObject()
                            task.findOne({ migration: ObjectId(id) }, (err, t) => {
                                if (err) {
                                    res.status(400).json({ error: err })
                                } else {
                                    if (t == null) {
                                        res.status(400).json({ error: "找不到对象" })
                                    } else {
                                        t = t.toObject()
                                        staff.findOne({ _id: t.staff }, (err, s) => {
                                            if (err) {
                                                res.status(400).json({ error: err })
                                            } else {
                                                if (t == null) {
                                                    res.status(400).json({ error: "找不到对象" })
                                                } else {
                                                    s = s.toObject()
                                                    t.staff = s
                                                    t.material = mm
                                                    t.migration = m
                                                    res.status(200).json(t)
                                                }
                                            }
                                        })
                                    }
                                }
                            })
                        }
                    }
                })
            }
        }
    })
})