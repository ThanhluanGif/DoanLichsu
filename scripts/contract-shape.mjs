import ts from "typescript";

const httpMethods = new Set(["get","post","put","patch","delete","head","options"]);

export function planningRows(markdown) {
  return markdown.split(/\r?\n/).flatMap((line) => {
    const match = /^\|\s*(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s*\|\s*`([^`]+)`/.exec(line);
    if (!match) return [];
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    return [{ method:match[1].toLowerCase(),path:match[2],access:cells[2] ?? "",input:cells[3] ?? "",output:cells[4] ?? "" }];
  });
}

export function planningOperations(markdown) {
  return [...new Set(planningRows(markdown).map((row) => `${row.method} ${row.path}`))].sort();
}

export function runtimeOperations(document) {
  return Object.entries(document.paths ?? {}).flatMap(([path,item]) =>
    Object.keys(item).filter((method) => httpMethods.has(method)).map((method) => `${method} ${path}`),
  ).sort();
}

function contractModel(markdown) {
  const code = /## Shared shapes[\s\S]*?```ts\s*\n([\s\S]*?)```/.exec(markdown)?.[1];
  if (!code) throw new Error("planning contract has no Shared shapes TypeScript block");
  const source = ts.createSourceFile("planning-contract.ts", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const interfaces = new Map();
  const aliases = new Map();
  for (const statement of source.statements) {
    if (ts.isInterfaceDeclaration(statement)) interfaces.set(statement.name.text, statement);
    if (ts.isTypeAliasDeclaration(statement)) aliases.set(statement.name.text, statement);
  }
  return { source,interfaces,aliases };
}

const scalar = (kind, values) => ({ kind,...(values ? { values:[...values].sort() } : {}) });
const object = (properties = {}, required = [], additional = "none") => ({
  kind:"object",properties:Object.fromEntries(Object.entries(properties).sort(([left],[right]) => left.localeCompare(right))),required:[...new Set(required)].sort(),additional,
});

function mergeObjects(left, right) {
  if (left.kind !== "object" || right.kind !== "object") return right;
  const properties = { ...left.properties,...right.properties };
  const required = new Set([...left.required,...right.required]);
  for (const name of Object.keys(right.properties)) {
    if (!right.required.includes(name)) required.delete(name);
  }
  return object(properties,[...required],right.additional === "none" ? left.additional : right.additional);
}

function unionDescriptor(items) {
  const flat = items.flatMap((item) => item.kind === "union" ? item.items : [item]);
  if (flat.every((item) => item.kind === "string" && item.values)) {
    return scalar("string",flat.flatMap((item) => item.values));
  }
  const unique = [...new Map(flat.map((item) => [JSON.stringify(item),item])).values()]
    .sort((left,right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  return unique.length === 1 ? unique[0] : { kind:"union",items:unique };
}

function propertyMembers(members, model, context) {
  const properties = {};
  const required = [];
  for (const member of members) {
    if (!ts.isPropertySignature(member) || !member.type || !member.name) continue;
    const name = member.name.getText().replace(/^['"]|['"]$/g, "");
    properties[name] = descriptorFromType(member.type,model,context);
    if (!member.questionToken) required.push(name);
  }
  return object(properties,required,"none");
}

function literalNames(node) {
  if (ts.isUnionTypeNode(node)) return node.types.flatMap(literalNames);
  if (ts.isLiteralTypeNode(node) && (ts.isStringLiteral(node.literal) || ts.isNumericLiteral(node.literal))) return [String(node.literal.text)];
  return [];
}

function referenceDescriptor(name, typeArguments, model, context) {
  if (context.substitutions?.has(name)) return context.substitutions.get(name);
  if ((name === "Array" || name === "ReadonlyArray") && typeArguments[0]) return { kind:"array",items:descriptorFromType(typeArguments[0],model,context) };
  if (name === "Partial" && typeArguments[0]) {
    const value = descriptorFromType(typeArguments[0],model,context);
    return value.kind === "object" ? object(value.properties,[],value.additional) : value;
  }
  if (name === "Omit" && typeArguments[0] && typeArguments[1]) {
    const value = descriptorFromType(typeArguments[0],model,context);
    if (value.kind !== "object") return value;
    const omitted = new Set(literalNames(typeArguments[1]));
    return object(Object.fromEntries(Object.entries(value.properties).filter(([key]) => !omitted.has(key))),value.required.filter((key) => !omitted.has(key)),value.additional);
  }
  if (name === "Record" && typeArguments[0] && typeArguments[1]) {
    const keys = descriptorFromType(typeArguments[0],model,context);
    const value = descriptorFromType(typeArguments[1],model,context);
    if (keys.kind === "string" && keys.values) return object(Object.fromEntries(keys.values.map((key) => [key,value])),keys.values,"none");
    return object({},[],value);
  }
  if (model.aliases.has(name)) return descriptorFromType(model.aliases.get(name).type,model,{ ...context,stack:new Set(context.stack).add(name) });
  if (model.interfaces.has(name)) {
    if (context.stack.has(name)) return { kind:"ref",name };
    const declaration = model.interfaces.get(name);
    const substitutions = new Map(context.substitutions ?? []);
    (declaration.typeParameters ?? []).forEach((parameter,index) => {
      if (typeArguments[index]) substitutions.set(parameter.name.text,descriptorFromType(typeArguments[index],model,context));
    });
    return descriptorFromInterface(declaration,model,{ stack:new Set(context.stack).add(name),substitutions });
  }
  return { kind:"any" };
}

function descriptorFromInterface(declaration, model, context) {
  let result = object();
  for (const clause of declaration.heritageClauses ?? []) {
    for (const parent of clause.types) {
      result = mergeObjects(result,referenceDescriptor(parent.expression.getText(),parent.typeArguments ?? [],model,context));
    }
  }
  return mergeObjects(result,propertyMembers(declaration.members,model,context));
}

function descriptorFromType(node, model, context = { stack:new Set(),substitutions:new Map() }) {
  if (!node) return { kind:"any" };
  if (ts.isParenthesizedTypeNode(node)) return descriptorFromType(node.type,model,context);
  if (ts.isArrayTypeNode(node)) return { kind:"array",items:descriptorFromType(node.elementType,model,context) };
  if (ts.isTypeLiteralNode(node)) return propertyMembers(node.members,model,context);
  if (ts.isUnionTypeNode(node)) return unionDescriptor(node.types.map((entry) => descriptorFromType(entry,model,context)));
  if (ts.isTypeReferenceNode(node)) return referenceDescriptor(node.typeName.getText(),node.typeArguments ?? [],model,context);
  if (ts.isLiteralTypeNode(node)) {
    if (ts.isStringLiteral(node.literal)) return scalar("string",[node.literal.text]);
    if (node.literal.kind === ts.SyntaxKind.TrueKeyword) return scalar("boolean",[true]);
    if (node.literal.kind === ts.SyntaxKind.FalseKeyword) return scalar("boolean",[false]);
    if (node.literal.kind === ts.SyntaxKind.NullKeyword) return { kind:"null" };
    if (ts.isNumericLiteral(node.literal)) return scalar("number",[Number(node.literal.text)]);
  }
  if (node.kind === ts.SyntaxKind.StringKeyword) return scalar("string");
  if (node.kind === ts.SyntaxKind.NumberKeyword) return scalar("number");
  if (node.kind === ts.SyntaxKind.BooleanKeyword) return scalar("boolean");
  if (node.kind === ts.SyntaxKind.NullKeyword) return { kind:"null" };
  if (node.kind === ts.SyntaxKind.UnknownKeyword || node.kind === ts.SyntaxKind.AnyKeyword) return { kind:"any" };
  return { kind:"any" };
}

function descriptorForExpression(expression, model) {
  const source = ts.createSourceFile("inline-contract.ts", `type ContractInline = ${expression};`,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  const alias = source.statements.find(ts.isTypeAliasDeclaration);
  return alias ? descriptorFromType(alias.type,model) : { kind:"any" };
}

function normalizeOpenApi(schema, document, stack = new Set()) {
  if (!schema || Object.keys(schema).length === 0) return { kind:"any" };
  if (schema.$ref) {
    const name = schema.$ref.split("/").at(-1);
    if (stack.has(name)) return { kind:"ref",name };
    return normalizeOpenApi(document.components?.schemas?.[name],document,new Set(stack).add(name));
  }
  if (schema.anyOf || schema.oneOf) return unionDescriptor((schema.anyOf ?? schema.oneOf).map((entry) => normalizeOpenApi(entry,document,stack)));
  if (schema.type === "array") return { kind:"array",items:normalizeOpenApi(schema.items ?? {},document,stack) };
  if (schema.type === "object" || schema.properties || schema.additionalProperties !== undefined) {
    const properties = Object.fromEntries(Object.entries(schema.properties ?? {}).map(([name,value]) => [name,normalizeOpenApi(value,document,stack)]));
    const additional = schema.additionalProperties === false ? "none" : schema.additionalProperties && typeof schema.additionalProperties === "object" ? normalizeOpenApi(schema.additionalProperties,document,stack) : { kind:"any" };
    return object(properties,schema.required ?? [],additional);
  }
  if (schema.type === "null") return { kind:"null" };
  const kind = schema.type === "integer" ? "number" : schema.type ?? "any";
  const values = schema.enum ?? (schema.const !== undefined ? [schema.const] : undefined);
  return scalar(kind,values);
}

function firstDifference(expected, actual, path = "shape") {
  if (expected.kind === "any") return null;
  if (expected.kind !== actual.kind) return `${path}: expected ${expected.kind}, OpenAPI ${actual.kind}`;
  if (expected.values && JSON.stringify(expected.values) !== JSON.stringify(actual.values ?? [])) return `${path}: expected enum [${expected.values.join(",")}], OpenAPI [${(actual.values ?? []).join(",")}]`;
  if (expected.kind === "array") return firstDifference(expected.items,actual.items,`${path}[]`);
  if (expected.kind === "union") {
    if (expected.items.length !== actual.items.length) return `${path}: expected ${expected.items.length} union branches, OpenAPI ${actual.items.length}`;
    for (let index = 0; index < expected.items.length; index += 1) {
      const difference = firstDifference(expected.items[index],actual.items[index],`${path}.union[${index}]`);
      if (difference) return difference;
    }
  }
  if (expected.kind === "object") {
    const expectedNames = Object.keys(expected.properties).sort();
    const actualNames = Object.keys(actual.properties).sort();
    if (JSON.stringify(expectedNames) !== JSON.stringify(actualNames)) return `${path}: property mismatch expected=[${expectedNames.join(",")}] OpenAPI=[${actualNames.join(",")}]`;
    if (JSON.stringify(expected.required) !== JSON.stringify(actual.required)) return `${path}: required mismatch expected=[${expected.required.join(",")}] OpenAPI=[${actual.required.join(",")}]`;
    const expectedAdditional = typeof expected.additional === "string" ? expected.additional : JSON.stringify(expected.additional);
    const actualAdditional = typeof actual.additional === "string" ? actual.additional : JSON.stringify(actual.additional);
    if (expectedAdditional !== actualAdditional) return `${path}: additionalProperties mismatch expected=${expectedAdditional} OpenAPI=${actualAdditional}`;
    for (const name of expectedNames) {
      const difference = firstDifference(expected.properties[name],actual.properties[name],`${path}.${name}`);
      if (difference) return difference;
    }
  }
  return null;
}

function compare(label, expected, schema, document, drift) {
  const difference = firstDifference(expected,normalizeOpenApi(schema,document),label);
  if (difference) drift.push(difference);
}

function expectedRoles(access) {
  const lower = access.toLowerCase();
  if (lower.startsWith("public")) return [];
  if (lower.includes("admin only")) return ["ADMIN"];
  if (lower.includes("editor/reviewer/admin")) return ["ADMIN","EDITOR","REVIEWER"];
  if (lower.includes("reviewer/admin")) return ["ADMIN","REVIEWER"];
  return ["ADMIN","EDITOR","REVIEWER"];
}

function expressionToken(cell) {
  return [...cell.matchAll(/`([^`]+)`/g)].map((match) => match[1]).find((token) => /^(?:DataResponse|ListResponse)</.test(token) || /^\w+$/.test(token)) ?? null;
}

export function contractShapeDrift(markdown, document) {
  const rows = planningRows(markdown);
  const model = contractModel(markdown);
  const drift = [];
  const cookieAuth = document.components?.securitySchemes?.cookieAuth;
  if (!cookieAuth || cookieAuth.type !== "apiKey" || cookieAuth.in !== "cookie" || cookieAuth.name !== "qsv_session") {
    drift.push("securitySchemes.cookieAuth must be apiKey in cookie named qsv_session");
  }
  for (const [schemaName,propertyName] of [["LoginInput","password"],["UserCreateInput","temporaryPassword"],["UserUpdateInput","resetPassword"]]) {
    if (document.components?.schemas?.[schemaName]?.properties?.[propertyName]?.writeOnly !== true) drift.push(`schema ${schemaName}.${propertyName} must be writeOnly`);
  }
  for (const row of rows) {
    const operation = document.paths?.[row.path]?.[row.method];
    if (!operation) continue;
    const roles = expectedRoles(row.access);
    const secured = (operation.security ?? []).some((requirement) => Object.hasOwn(requirement,"cookieAuth"));
    if (roles.length === 0 && secured) drift.push(`${row.method} ${row.path}: public planning row unexpectedly requires cookieAuth`);
    if (roles.length > 0 && !secured) drift.push(`${row.method} ${row.path}: protected planning row missing cookieAuth`);
    const actualRoles = [...(operation["x-allowed-roles"] ?? [])].sort();
    if (roles.length > 0 && JSON.stringify(roles) !== JSON.stringify(actualRoles)) drift.push(`${row.method} ${row.path}: roles expected=[${roles.join(",")}] OpenAPI=[${actualRoles.join(",")}]`);

    const pathNames = [...row.path.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    const actualPath = (operation.parameters ?? []).filter((parameter) => parameter.in === "path");
    const actualPathNames = actualPath.map((parameter) => parameter.name).sort();
    if (JSON.stringify(pathNames) !== JSON.stringify(actualPathNames)) drift.push(`${row.method} ${row.path}: path parameters expected=[${pathNames.join(",")}] OpenAPI=[${actualPathNames.join(",")}]`);
    for (const name of pathNames) {
      const parameter = actualPath.find((candidate) => candidate.name === name);
      if (!parameter) continue;
      if (parameter.required !== true) drift.push(`${row.method} ${row.path}: path parameter ${name} must be required`);
      const type = name === "locale" ? "Locale" : name === "type" ? "ContentType" : "string";
      compare(`${row.method} ${row.path} path.${name}`,descriptorForExpression(type,model),parameter.schema,document,drift);
    }

    const queryToken = /query\s+`([^`]+)`/i.exec(row.input)?.[1];
    const actualQuery = (operation.parameters ?? []).filter((parameter) => parameter.in === "query");
    if (queryToken) {
      const expected = descriptorForExpression(queryToken,model);
      const actual = object(Object.fromEntries(actualQuery.map((parameter) => [parameter.name,normalizeOpenApi(parameter.schema ?? {},document)])),actualQuery.filter((parameter) => parameter.required).map((parameter) => parameter.name),"none");
      const difference = firstDifference(expected,actual,`${row.method} ${row.path} query`);
      if (difference) drift.push(difference);
    } else if (actualQuery.length) {
      drift.push(`${row.method} ${row.path}: OpenAPI has undocumented query parameters [${actualQuery.map((parameter) => parameter.name).join(",")}]`);
    }

    if (["post","put","patch","delete"].includes(row.method)) {
      const bodyToken = [...row.input.matchAll(/`([^`]+)`/g)].map((match) => match[1]).find((token) => model.interfaces.has(token) || model.aliases.has(token));
      const actualBody = operation.requestBody?.content?.["application/json"]?.schema;
      if (bodyToken) compare(`${row.method} ${row.path} request`,descriptorForExpression(bodyToken,model),actualBody,document,drift);
      else if (actualBody) drift.push(`${row.method} ${row.path}: OpenAPI has an undocumented JSON request body`);
    }

    const outputToken = expressionToken(row.output);
    const successStatus = Object.keys(operation.responses ?? {}).filter((value) => /^2\d\d$/.test(value)).sort()[0];
    const success = successStatus ? operation.responses[successStatus]?.content?.["application/json"]?.schema : null;
    if (outputToken && (model.interfaces.has(outputToken) || /^(?:DataResponse|ListResponse)</.test(outputToken))) {
      compare(`${row.method} ${row.path} response`,descriptorForExpression(outputToken,model),success,document,drift);
    }
  }
  return drift;
}
