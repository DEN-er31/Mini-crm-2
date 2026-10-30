const TABLES = Object.freeze({ clients: "clients", deals: "deals", tasks: "tasks" });
const FIELDS = Object.freeze({
  clients: {
    name: "name", email: "email", phone: "phone", company: "company",
    category: "category", status: "status", notes: "notes",
  },
  deals: {
    title: "title", clientId: "client_id", amount: "amount", status: "status", closeDate: "close_date",
  },
  tasks: {
    title: "title", description: "description", clientId: "client_id", dealId: "deal_id",
    dueDate: "due_date", priority: "priority", status: "status",
  },
});

const emptyRecords = () => ({ clients: [], deals: [], tasks: [] });
const clone = (record) => ({ ...record });

function fromDatabase(entity, row) {
  if (entity === "clients") {
    return {
      id: row.id, name: row.name, email: row.email || "", phone: row.phone || "",
      company: row.company || "", category: row.category, status: row.status,
      notes: row.notes || "", createdAt: row.created_at,
    };
  }
  if (entity === "deals") {
    return {
      id: row.id, title: row.title, clientId: row.client_id, amount: Number(row.amount),
      status: row.status, closeDate: row.close_date || "", createdAt: row.created_at,
    };
  }
  return {
    id: row.id, title: row.title, description: row.description || "", clientId: row.client_id || "",
    dealId: row.deal_id || "", dueDate: row.due_date, priority: row.priority, status: row.status,
  };
}

function toDatabase(entity, values) {
  const mapping = FIELDS[entity];
  if (!mapping) throw new Error("Неизвестный тип записи.");
  const row = {};
  for (const [appField, dbField] of Object.entries(mapping)) {
    if (!Object.hasOwn(values, appField)) continue;
    const value = values[appField];
    row[dbField] = value === "" && ["email", "phone", "company", "notes", "clientId", "dealId", "closeDate"].includes(appField)
      ? null
      : value;
  }
  return row;
}

export function createRepository(initialData, client, remoteEnabled) {
  let records = structuredClone(initialData);
  let sequence = 4000;

  return {
    list(entity) {
      if (!TABLES[entity]) throw new Error("Неизвестный тип записи.");
      return records[entity].map(clone);
    },
    get(entity, id) {
      if (!TABLES[entity]) throw new Error("Неизвестный тип записи.");
      const record = records[entity].find((item) => item.id === id);
      return record ? clone(record) : null;
    },
    async load() {
      if (!remoteEnabled || !client) return;
      const [clients, deals, tasks] = await Promise.all([
        client.from(TABLES.clients).select("*").order("created_at", { ascending: false }),
        client.from(TABLES.deals).select("*").order("created_at", { ascending: false }),
        client.from(TABLES.tasks).select("*").order("due_date", { ascending: true }),
      ]);
      for (const result of [clients, deals, tasks]) {
        if (result.error) throw result.error;
      }
      records = {
        clients: clients.data.map((row) => fromDatabase("clients", row)),
        deals: deals.data.map((row) => fromDatabase("deals", row)),
        tasks: tasks.data.map((row) => fromDatabase("tasks", row)),
      };
    },
    async add(entity, values) {
      if (!TABLES[entity]) throw new Error("Неизвестный тип записи.");
      if (remoteEnabled) {
        const { data, error } = await client.from(TABLES[entity]).insert(toDatabase(entity, values)).select("*").single();
        if (error) throw error;
        const record = fromDatabase(entity, data);
        records[entity].unshift(record);
        return clone(record);
      }
      const record = { ...values, id: `${entity[0]}-${++sequence}` };
      records[entity].unshift(record);
      return clone(record);
    },
    async update(entity, id, values) {
      if (!TABLES[entity]) throw new Error("Неизвестный тип записи.");
      if (remoteEnabled) {
        const { data, error } = await client.from(TABLES[entity]).update(toDatabase(entity, values)).eq("id", id).select("*").maybeSingle();
        if (error) throw error;
        if (!data) return null;
        const record = fromDatabase(entity, data);
        const index = records[entity].findIndex((item) => item.id === id);
        if (index < 0) records[entity].unshift(record);
        else records[entity][index] = record;
        return clone(record);
      }
      const index = records[entity].findIndex((item) => item.id === id);
      if (index < 0) return null;
      records[entity][index] = { ...records[entity][index], ...values, id };
      return clone(records[entity][index]);
    },
    async delete(entity, id) {
      if (!TABLES[entity]) throw new Error("Неизвестный тип записи.");
      if (remoteEnabled) {
        const { data, error } = await client.from(TABLES[entity]).delete().eq("id", id).select("id").maybeSingle();
        if (error) throw error;
        if (!data) return false;
      }
      const index = records[entity].findIndex((item) => item.id === id);
      if (index < 0) return false;
      records[entity].splice(index, 1);
      return true;
    },
    clear() {
      records = emptyRecords();
    },
  };
}
