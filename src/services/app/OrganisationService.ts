import {
  Organization,
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
} from "../../domain/models/Organization";
import { organisationRepository, OrganisationRepository } from "../../repositories/OrganisationRepository";
import { ValidationError, formatZodError } from "../../domain/errors/AppError";
import { QueryOptions } from "../../repositories/base/IRepository";

export class OrganisationService {
  constructor(private repo: OrganisationRepository = organisationRepository) {}

  async getOrganisations(options?: QueryOptions): Promise<Organization[]> {
    return this.repo.getAll(undefined, options);
  }

  async getOrganisationById(id: string): Promise<Organization | null> {
    if (!id) {
      throw new ValidationError("Organisation ID is required");
    }
    return this.repo.getById(id);
  }

  async findByEmail(email: string): Promise<Organization | null> {
    if (!email) return null;
    return this.repo.findByEmail(email);
  }

  async createOrganisation(input: unknown): Promise<Organization> {
    const parseResult = CreateOrganizationSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Organisation validation failed: ${errorMsg}`, parseResult.error.format());
    }

    return this.repo.create(parseResult.data);
  }

  async updateOrganisation(id: string, input: unknown): Promise<Organization> {
    if (!id) {
      throw new ValidationError("Organisation ID is required for update");
    }

    const parseResult = UpdateOrganizationSchema.safeParse(input);
    if (!parseResult.success) {
      const errorMsg = formatZodError(parseResult.error);
      throw new ValidationError(`Organisation update validation failed: ${errorMsg}`, parseResult.error.format());
    }

    return this.repo.update(id, parseResult.data);
  }

  async deleteOrganisation(id: string): Promise<boolean> {
    if (!id) {
      throw new ValidationError("Organisation ID is required for deletion");
    }
    return this.repo.delete(id);
  }
}

export const organisationService = new OrganisationService();
