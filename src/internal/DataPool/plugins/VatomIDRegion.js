
import BLOCKvRegion from './BLOCKvRegion'
import DataObject from '../DataObject'

/**
 * This region plugin provides access to a collection of vatoms identified by their IDs.
 * The 'inventory' region is much mor reliable, so if you know that your vatoms are owned bby the current user,
 * use the inventory region with a filter rather.
 *
 * TODO: Retry a few times
 *
 * To get an instance, call `DataPool.region('ids', ["id1", "id2"])`
 */
export default class VatomIDRegion extends BLOCKvRegion {
  /** Plugin ID */
  static get id () { return 'ids' }

  /** Constructor */
  constructor (dataPool, ids) {
    super(dataPool)

    // Store IDs. Sort them to keep our stateKey in check.
    this.ids = ids.sort()
  }

  /** Our state key is the list of IDs */
  get stateKey () {
    return 'ids:' + this.ids.join(',')
  }

  /** Check if a region request matches our region */
  matches (id, descriptor) {
    // Check all filters match
    if (id !== 'ids') return false
    if (!descriptor || descriptor.length !== this.ids.length) return false
    for (let i = 0; i < this.ids.length; i++) {
      if (descriptor[i] !== this.ids[i]) {
        return false
      }
    }

    // Yes they do
    return true
  }

  /** Load current state from the server */
  async load () {
    // Pause websocket events
    this.pauseMessages()

    // Fetch data
    let response = await this.dataPool.Blockv.client.request('POST', '/v1/user/vatom/get', { ids: this.ids })

    // Add vatom to new objects list
    let objects = []
    response.vatoms.map(v => new DataObject('vatom', v.id, v)).forEach(f => objects.push(f))

    // Add faces to new objects list
    response.faces.map(f => new DataObject('face', f.id, f)).forEach(f => objects.push(f))

    // Add actions to new objects list
    response.actions.map(a => new DataObject('action', a.name, a)).forEach(a => objects.push(a))

    // Add new objects
    this.addObjects(objects)

    // Resume websocket messages
    this.resumeMessages()

    // Return array of IDs
    return objects.map(o => o.id)
  }
}
