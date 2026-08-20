import { FirestoreBaseRepository } from "../base/FirestoreBaseRepository";
import { setRuntimeTenantId, clearRuntimeTenantId } from "../../context/tenantRuntime";

class TestRepository extends FirestoreBaseRepository<{ id: string; name: string }> {
  constructor() {
    super("test_items");
  }
}

describe("FirestoreBaseRepository - Tenant Resolution", () => {
  let repo: TestRepository;

  beforeEach(() => {
    repo = new TestRepository();
    clearRuntimeTenantId();
  });

  afterEach(() => {
    clearRuntimeTenantId();
  });

  it("returns base collection name when tenant is default or not set", () => {
    expect(repo.getCollectionName()).toBe("test_items");
    expect(repo.getCollectionName("default")).toBe("test_items");
  });

  it("returns tenant-prefixed collection name when runtime tenant is set", () => {
    setRuntimeTenantId("branch_north");
    expect(repo.getCollectionName()).toBe("branch_north-test_items");
  });

  it("prioritizes explicitly passed tenantId parameter over runtime tenant", () => {
    setRuntimeTenantId("branch_north");
    expect(repo.getCollectionName("branch_south")).toBe("branch_south-test_items");
  });

  it("resolves scoped arbitrary collection names accurately", () => {
    expect(repo.getScopedCollection("payments")).toBe("payments");
    expect(repo.getScopedCollection("payments", "default")).toBe("payments");

    setRuntimeTenantId("branch_north");
    expect(repo.getScopedCollection("payments")).toBe("branch_north-payments");
    expect(repo.getScopedCollection("payments", "branch_south")).toBe("branch_south-payments");
  });
});
