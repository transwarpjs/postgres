'use strict'

import _pg from 'pg'
import dialect from './dialect'

const pg = _pg.native || _pg

export default {

  connect(dsn) {
    return new Promise((resolve, reject) => {
      pg.connect(dsn, (err, client, done) => {
        if (err) return reject(err)
        resolve({ client, done })
      })
    })
  },

  ping(conn) {
    return conn.then(({ client, done }) => {
      return new Promise((resolve, reject) => {
        client.query('', err => {
          done()
          err ? reject(err) : resolve(true)
        })
      })
    })
  },

  exec(conn, sql = '', values) {
    return conn.then(({ client, done }) => {
      return new Promise((resolve, reject) => {
        console.log('   sql:', sql)
        console.log('values:', values)
        client.query(sql, values, (err, result) => {
          // release pool conn
          done(err)

          // throw err or response result
          err ? reject(err) : resolve(result)
        })
      })
    })
  },

  get dialect() {
    return dialect
  },

  insert(conn, scope) {
    return this.exec(conn, '', [])
  },

  find() {
  },

  update() {
  },

  delete() {
  }

}
