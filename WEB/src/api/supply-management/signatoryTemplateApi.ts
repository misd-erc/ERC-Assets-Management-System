import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';
import { IARSignatories } from '@/components/assets/reports/IARReportModal';
import { RISSignatories } from '@/components/assets/reports/RISReportModal';

export interface IARSignatoryTemplateDto {
  id: number;
  name: string;
  signatoryDataJson: string;
  createdAt: string;
  signatories?: IARSignatories;
}

export interface RISSignatoryTemplateDto {
  id: number;
  name: string;
  signatoryDataJson: string;
  createdAt: string;
  signatories?: RISSignatories;
}

const parseTemplate = (raw: any): IARSignatoryTemplateDto => {
  let signatories: IARSignatories | undefined;
  try { signatories = JSON.parse(raw.signatoryDataJson); } catch { /* leave undefined */ }
  return { id: raw.id, name: raw.name, signatoryDataJson: raw.signatoryDataJson, createdAt: raw.createdAt, signatories };
};

export const getIARSignatoryTemplates = async (): Promise<IARSignatoryTemplateDto[]> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const response = await axiosInstance.get('/Supply/iar/signatory-templates', {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });
    if (!response.data.success) return [];
    return (response.data.data as any[]).map(parseTemplate);
  } catch {
    return [];
  }
};

export const saveIARSignatoryTemplate = async (name: string, signatories: IARSignatories, id: number = 0): Promise<IARSignatoryTemplateDto | null> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const response = await axiosInstance.post('/Supply/iar/signatory-templates/edit', {
      Id: id,
      Name: name,
      SignatoryDataJson: JSON.stringify(signatories),
      ActionBySystemUserId: systemUserId,
      SessionKey: sessionKey,
    });
    if (!response.data.success) return null;
    return parseTemplate(response.data.data);
  } catch {
    return null;
  }
};

export const deleteIARSignatoryTemplate = async (templateId: number): Promise<boolean> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const response = await axiosInstance.delete(`/Supply/iar/signatory-templates/delete/${templateId}`, {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });
    return response.data.success === true;
  } catch {
    return false;
  }
};

const parseRISTemplate = (raw: any): RISSignatoryTemplateDto => {
  let signatories: RISSignatories | undefined;
  try { signatories = JSON.parse(raw.signatoryDataJson); } catch { /* leave undefined */ }
  return { id: raw.id, name: raw.name, signatoryDataJson: raw.signatoryDataJson, createdAt: raw.createdAt, signatories };
};

export const getRISSignatoryTemplates = async (): Promise<RISSignatoryTemplateDto[]> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const response = await axiosInstance.get('/Supply/ris/signatory-templates', {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });
    if (!response.data.success) return [];
    return (response.data.data as any[]).map(parseRISTemplate);
  } catch {
    return [];
  }
};

export const saveRISSignatoryTemplate = async (name: string, signatories: RISSignatories, id: number = 0): Promise<RISSignatoryTemplateDto | null> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const response = await axiosInstance.post('/Supply/ris/signatory-templates/edit', {
      Id: id,
      Name: name,
      SignatoryDataJson: JSON.stringify(signatories),
      ActionBySystemUserId: systemUserId,
      SessionKey: sessionKey,
    });
    if (!response.data.success) return null;
    return parseRISTemplate(response.data.data);
  } catch {
    return null;
  }
};

export const deleteRISSignatoryTemplate = async (templateId: number): Promise<boolean> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const response = await axiosInstance.delete(`/Supply/ris/signatory-templates/delete/${templateId}`, {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });
    return response.data.success === true;
  } catch {
    return false;
  }
};
