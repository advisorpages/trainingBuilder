import { PersonalizedName, PersonalizedNameType } from '@leadership-training/shared';
import { api } from './api.service';

export interface CreatePersonalizedNameRequest {
  type: PersonalizedNameType;
  customLabel?: string;
  name: string;
}

export interface UpdatePersonalizedNameRequest extends Partial<CreatePersonalizedNameRequest> {}

class PersonalizedNamesService {
  private readonly baseUrl = '/personalized-names';

  async create(request: CreatePersonalizedNameRequest): Promise<PersonalizedName> {
    const response = await api.post<PersonalizedName>(this.baseUrl, request);
    return response.data;
  }

  async findAll(): Promise<PersonalizedName[]> {
    const response = await api.get<PersonalizedName[]>(this.baseUrl);
    return response.data;
  }

  async findOne(id: string): Promise<PersonalizedName> {
    const response = await api.get<PersonalizedName>(`${this.baseUrl}/${id}`);
    return response.data;
  }

  async update(id: string, request: UpdatePersonalizedNameRequest): Promise<PersonalizedName> {
    const response = await api.patch<PersonalizedName>(`${this.baseUrl}/${id}`, request);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async getByType(type: PersonalizedNameType): Promise<string | null> {
    try {
      const response = await api.get<{ name: string | null }>(`${this.baseUrl}/type/${type}`);
      return response.data.name;
    } catch (error) {
      console.warn(`Failed to fetch name for type ${type}:`, error);
      return null;
    }
  }

  async getNameByType(type: PersonalizedNameType): Promise<string | null> {
    return this.getByType(type);
  }
}

export const personalizedNamesService = new PersonalizedNamesService();