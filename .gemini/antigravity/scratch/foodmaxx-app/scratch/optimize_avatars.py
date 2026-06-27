import os
from PIL import Image

def optimize_image(filename):
    input_path = os.path.join('public', filename + '.png')
    output_path = os.path.join('public', filename + '.webp')
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return
        
    img = Image.open(input_path)
    print(f"Original {filename}: size={img.size}, format={img.format}, bytes={os.path.getsize(input_path)}")
    
    # Resize to 160x160
    # Use Resampling if available, otherwise fallback to ANTIALIAS (for older PIL versions)
    try:
        resample_mode = Image.Resampling.LANCZOS
    except AttributeError:
        resample_mode = Image.ANTIALIAS
        
    resized_img = img.resize((160, 160), resample_mode)
    
    # Save as WebP
    resized_img.save(output_path, 'WEBP', quality=85)
    print(f"Optimized {filename}: size={resized_img.size}, bytes={os.path.getsize(output_path)}")
    
    # Remove original PNG
    os.remove(input_path)
    print(f"Removed original {input_path}")

if __name__ == '__main__':
    optimize_image('avatar_male')
    optimize_image('avatar_female')
