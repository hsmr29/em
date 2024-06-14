import { RxCollection, RxDatabase, addRxPlugin, createRxDatabase } from 'rxdb'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { LexemeDocType, lexemeSchema } from './schemas/lexeme'
import { PermissionDocType, permissionSchema } from './schemas/permission'
import { ThoughtDocType, thoughtSchema } from './schemas/thought'

if (import.meta.env.MODE === 'development') {
  addRxPlugin(RxDBDevModePlugin)
}

const DATABASE_NAME = 'em'

type EmRxDB = RxDatabase<{
  thoughts: RxCollection<ThoughtDocType>
  lexemes: RxCollection<LexemeDocType>
  permissions: RxCollection<PermissionDocType>
}>

/* rxDB database */
export let rxDB: EmRxDB

/** Initialize the thoughtspace. */
export const init = async () => {
  rxDB = await createRxDatabase({
    name: DATABASE_NAME,
    storage: getRxStorageDexie(),
    ignoreDuplicate: import.meta.env.MODE === 'test',
  })

  await rxDB.addCollections({
    thoughts: {
      schema: thoughtSchema,
    },
    lexemes: {
      schema: lexemeSchema,
    },
    permissions: {
      schema: permissionSchema,
    },
  })
}
