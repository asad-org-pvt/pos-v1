import { organisationService } from "../../services/app/OrganisationService";

// Get Organisations from database
export const getAllOrganisations = async () => {
  return await organisationService.getOrganisations();
};

// Add an Organisation to database
export const addOneOrganisation = async (organisation: any) => {
  return await organisationService.createOrganisation(organisation);
};

// Delete an Organisation API
export const deleteOneOrganisation = async (id: string) => {
  return await organisationService.deleteOrganisation(id);
};

// Edit an Organisation API
export const editOrganisation = async (id: string, organisation: any) => {
  return await organisationService.updateOrganisation(id, organisation);
};
