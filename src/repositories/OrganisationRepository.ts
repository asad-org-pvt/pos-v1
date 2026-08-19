import { Organization, CreateOrganizationInput, UpdateOrganizationInput } from "../domain/models/Organization";
import { FirestoreBaseRepository } from "./base/FirestoreBaseRepository";

export class OrganisationRepository extends FirestoreBaseRepository<Organization, CreateOrganizationInput, UpdateOrganizationInput> {
  constructor() {
    super("organisations");
  }

  // Organizations are stored at the top-level collection "organisations"
  public getCollectionName(): string {
    return "organisations";
  }

  async findByEmail(email: string): Promise<Organization | null> {
    const list = await this.getAll(undefined, {
      whereField: "email",
      whereOp: "==",
      whereValue: email,
      limit: 1,
    });
    return list.length > 0 ? list[0] : null;
  }
}

export const organisationRepository = new OrganisationRepository();
