import axiosInstance from '@/lib/axios';
import { getAuthParams } from '@/utils/auth';
import { RPCPPESignatories } from '@/components/assets/reports/RPCPPEFilterModal';

export interface RPCPPESignatoryTemplateDto {
  id: number;
  name: string;
  signatoryDataJson: string;
  createdAt: string;
  signatories?: RPCPPESignatories;
}

const parseTemplate = (raw: any): RPCPPESignatoryTemplateDto => {
  let signatories: RPCPPESignatories | undefined;
  try { signatories = JSON.parse(raw.signatoryDataJson); } catch { /* leave undefined */ }
  return { id: raw.id, name: raw.name, signatoryDataJson: raw.signatoryDataJson, createdAt: raw.createdAt, signatories };
};

export const getRPCPPESignatoryTemplates = async (): Promise<RPCPPESignatoryTemplateDto[]> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const response = await axiosInstance.get('/Inventory/pta/rpcppe/signatory-templates', {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });
    if (!response.data.success) return [];
    return (response.data.data as any[]).map(parseTemplate);
  } catch {
    return [];
  }
};

export const saveRPCPPESignatoryTemplate = async (name: string, signatories: RPCPPESignatories, id: number = 0): Promise<RPCPPESignatoryTemplateDto | null> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const response = await axiosInstance.post('/Inventory/pta/rpcppe/signatory-templates/edit', {
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

export const deleteRPCPPESignatoryTemplate = async (templateId: number): Promise<boolean> => {
  try {
    const { systemUserId, sessionKey } = getAuthParams();
    const response = await axiosInstance.delete(`/Inventory/pta/rpcppe/signatory-templates/delete/${templateId}`, {
      params: { ActionBySystemUserId: systemUserId, SessionKey: sessionKey },
    });
    return response.data.success === true;
  } catch {
    return false;
  }
};
