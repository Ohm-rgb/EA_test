import os
import shutil

def clean_pycache(root_dir):
    for root, dirs, files in os.walk(root_dir):
        # Remove __pycache__ directories
        if "__pycache__" in dirs:
            pycache_path = os.path.join(root, "__pycache__")
            print(f"Removing {pycache_path}")
            shutil.rmtree(pycache_path)
            dirs.remove("__pycache__")  # Don't visit __pycache__ directories

        # Remove .pyc files
        for file in files:
            if file.endswith(".pyc"):
                file_path = os.path.join(root, file)
                print(f"Removing {file_path}")
                os.remove(file_path)

if __name__ == "__main__":
    # Clean backend directory
    backend_dir = os.path.join(os.path.dirname(__file__), '..', 'backend')
    clean_pycache(backend_dir)
    print("✅ Pycache cleaning complete.")
