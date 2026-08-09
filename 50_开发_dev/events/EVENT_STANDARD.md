# Domain Event Standard V0.1

## 命名
`PascalCase + 过去式`

正确：
- FamilyCreated
- FamilyMemberAdded
- LifeStageAssigned
- ConsentGranted
- GrowthActionCompleted
- OutcomeMeasured

避免：
- createFamily
- family_update
- SomethingChanged

## Envelope

```json
{
  "eventId": "uuid",
  "eventName": "FamilyCreated",
  "eventVersion": 1,
  "aggregateType": "Family",
  "aggregateId": "uuid",
  "occurredAt": "ISO-8601",
  "correlationId": "string",
  "causationId": "string|null",
  "actor": {
    "type": "PARENT|STAFF|SYSTEM|AI",
    "id": "string"
  },
  "source": "family-api",
  "payload": {}
}
```

## 版本
- 新增optional字段：eventVersion可不变
- 删除/改名/语义改变：升major eventVersion
- Consumer必须显式声明支持版本
- 不允许静默改变历史事件语义

## 不可变
Domain Event append-only。
