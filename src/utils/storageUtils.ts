/**
 * Uploads a product or shop image locally and returns a Base64 Data URL.
 */
export async function uploadProductImage(file: File, _folder: string = 'products'): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
