// lib/utils/types.ts

/**
 Why this file is useful:
 - It keeps your data shape consistent across the app
 - If you change the memories table later, you update one central type
 - Your editor can catch mistakes early, like memory.titel or memory.createdAt
 - It helps other developers (and future you) understand what data is expected


 How it is used:
 - Memory is used when fetching memories from Supabase and rendering them
 - MemoryFormValues is used when building the create-memory form
Example:
 - useState<Memory[]>([]) tells TypeScript that the list will contain Memory objects.
 - initialValues: MemoryFormValues tells the form exactly what fields it uses.


 Interface defines a Typescript shape for an object. 
 It is not compiled to JavaScript, but it helps with type checking and editor autocompletion.   
 */

/**
 * A memory record from the Supabase `memories` table.
 * Should match the columns in the database, including types and optionality.
 */
export interface Memory {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  image_urls: string[] | null;
  image_captions: string[] | null;
  image_timestamps: string[] | null;
  memory_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  year: number | null;

  /**
   * Purpose of null: In Supabase, the `updated_at` field is often set to `null`
   * when a record is first created and has not been updated yet
   * It will be populated with a timestamp when the record is modified.
   * This allows you to track when a memory was last updated,
   * while also indicating that it has not been changed since its creation if the value is `null`.
   */
}

/**
 * Values used by the memory form.
 */
export interface MemoryFormValues {
  title: string;
  content: string;
  image_urls?: string[] | null;
  image_captions?: string[] | null;
  image_timestamps?: string[] | null;
}
