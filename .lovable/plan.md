

## Fix: Add missing permission properties in `usePermissions.ts`

The fallback object (when `session` is null) is missing three properties that were added to the `Permissions` type: `canEditClientDetails`, `canApproveGoLive`, and `canRegressStage`.

### Change

**`src/hooks/usePermissions.ts`** — Add the three missing properties to the null-session fallback:

```typescript
canEditClientDetails: false,
canApproveGoLive: false,
canRegressStage: false,
```

These go after `canAdvanceOnboarding: false,` in the returned object.

