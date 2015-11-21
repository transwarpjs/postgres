'use strict'

import os from 'os'
import _pg from 'pg'
import dialect from './dialect'

// https://github.com/brianc/node-pg-native
const pg = _pg.native || _pg
// https://github.com/brianc/node-pg-types
const types = _pg.types

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
        console.log('exec start ==>>')
        console.log('   sql:', sql)
        console.log('values:', values)
        console.log('exec  end <<==')
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

  insert(scope) {
    const searcher = scope.searcher
    scope.searcher.select('id')
    const command = searcher._cmd.toUpperCase()
    const table = searcher._modelName
    const columns = searcher._selectionSet
    const fieldSet = scope.searcher._fieldSet

    const args = []
    const values = []
    const sql = this.formatSql(`
${command} INTO ${table}
  ${dialect.insert(fieldSet, values, args)} VALUES
  (${args.join(', ')})
  ${dialect.returning(columns)}`)

    return this.exec(scope.db.conn, sql, values).then(result => {
      return result.rows
    })
  },

  find(scope) {
    const searcher = scope.searcher
    const table = searcher._modelName
    const command = 'SELECT'
    const columns = searcher._selectionSet
    const searchConditions = scope.searcher._whereConditions
    const orders = scope.searcher._sortConditions
    const groups = scope.searcher._groupConditions
    const limit = scope.searcher._limit
    const skip = scope.searcher._skip

    const values = []
    const sql = this.formatSql(`
${command} ${dialect.select(columns)}
  FROM ${table}
  ${dialect.where(searchConditions, values)}
  ${dialect.sort(orders)}
  ${dialect.group(groups)}
  ${dialect.limit(limit)}
  ${dialect.skip(skip)}`)

    return this.exec(scope.db.conn, sql, values).then(result => {
      return result.rows
    })
  },

  count(scope) {
    scope.searcher.select('count(*)')
    return this.find(scope).then(rows => rows[0].count)
  },

  update(scope) {
    const searcher = scope.searcher
    const command = searcher._cmd.toUpperCase()
    const table = searcher._modelName
    const columns = searcher._selectionSet
    const searchConditions = scope.searcher._whereConditions
    searcher.where('id', scope.value.get('id'))
    const updateColumns = scope.searcher._updateColumns
    const values = []
    const sql = this.formatSql(`
${command} ${table}
  SET ${dialect.set(updateColumns, values)}
  ${dialect.where(searchConditions, values)}
  ${dialect.returning(columns)}`)

    return this.exec(scope.db.conn, sql, values).then(result => {
      return result
    })
  },

  delete(scope) {
    const searcher = scope.searcher
    const command = searcher._cmd.toUpperCase()
    const table = searcher._modelName
    const columns = searcher._selectionSet
    const searchConditions = scope.searcher._whereConditions

    const values = []
    const sql = this.formatSql(`
${command} FROM ${table}
  ${dialect.where(searchConditions, values)}
  ${dialect.returning(columns, true)}`)

    return this.exec(scope.db.conn, sql, values).then(result => {
      return result.rows
    })
  },

  hasTable(scope) {
    const table = scope.search._modelName
    return this.exec(scope.db.conn, dialect.hasTableSql, [table])
    .then(result => {
      return result.rowCount > 0
    })
  },

  currentDatabase(scope) {
    return this.exec(scope.db.conn, dialect.currentDatabaseSql)
    .then(result => {
      return result.rows[0]
    })
  },

  formatSql: (sql) {
    const r = new RegExp(`${os.EOL}\\s*`, 'g')
    return sql.replace(r, ' ').trim()
  }

}
