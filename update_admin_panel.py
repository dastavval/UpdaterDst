import sys

file_path = 'src/components/AdminPanel.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replacement 1: handleToggleFactoryActive
old_active = """  const handleToggleFactoryActive = async (factoryId: string) => {
    setLoading(true);
    try {
      const updatedFactories = factories.map(f => f.id === factoryId ? { ...f, isActive: f.isActive === undefined ? false : !f.isActive } : f);
      const updatedConfig = {
        ...b2bConfig,
        factories: updatedFactories
      };
      await onUpdateB2bConfig(updatedConfig);
      setFactories(updatedFactories);
      setSuccessMsg("وضعیت فعال‌سازی کارخانه با موفقیت تغییر یافت.");
    } catch (err: any) {
      setErrorMsg("خطا در تغییر وضعیت فعال‌سازی کارخانه.");
    } finally {
      setLoading(false);
    }
  };"""

new_active = """  const handleToggleFactoryActive = async (factoryId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/b2b/factories/${factoryId}/toggle-active`, {
        method: "PATCH"
      });
      const data = await res.json();
      if (data.success) {
        setFactories(data.factories);
        if (onUpdateB2bConfig) {
          onUpdateB2bConfig({ ...b2bConfig, factories: data.factories });
        }
        setSuccessMsg("وضعیت فعال‌سازی کارخانه با موفقیت تغییر یافت.");
      } else {
        throw new Error(data.error || "Failed to toggle status");
      }
    } catch (err: any) {
      console.error("Factory toggle error:", err);
      setErrorMsg("خطا در تغییر وضعیت فعال‌سازی کارخانه.");
    } finally {
      setLoading(false);
    }
  };"""

# Replacement 2: handleToggleFactoryFeatured
old_featured = """  const handleToggleFactoryFeatured = async (factoryId: string) => {
    setLoading(true);
    try {
      const updatedFactories = factories.map(f => f.id === factoryId ? { ...f, isFeatured: !f.isFeatured } : f);
      const updatedConfig = { ...b2bConfig, factories: updatedFactories };
      await onUpdateB2bConfig(updatedConfig);
      setFactories(updatedFactories);
      setSuccessMsg("وضعیت ویژه کارخانه بروزرسانی شد.");
    } catch (err) {
      setErrorMsg("خطا در تغییر وضعیت ویژه.");
    } finally {
      setLoading(false);
    }
  };"""

new_featured = """  const handleToggleFactoryFeatured = async (factoryId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/b2b/factories/${factoryId}/toggle-featured`, {
        method: "PATCH"
      });
      const data = await res.json();
      if (data.success) {
        setFactories(data.factories);
        if (onUpdateB2bConfig) {
          onUpdateB2bConfig({ ...b2bConfig, factories: data.factories });
        }
        setSuccessMsg("وضعیت ویژه کارخانه بروزرسانی شد.");
      } else {
        throw new Error(data.error || "Failed to toggle featured");
      }
    } catch (err) {
      console.error("Factory featured toggle error:", err);
      setErrorMsg("خطا در تغییر وضعیت ویژه.");
    } finally {
      setLoading(false);
    }
  };"""

# Replacement 3: handleDeleteFactory
old_delete = """  const handleDeleteFactory = async (factoryId: string) => {
    confirmAction("حذف کارخانه", "آیا از حذف این کارخانه اطمینان دارید؟", async () => {
      setLoading(true);
      try {
        const updatedFactories = factories.filter(f => f.id !== factoryId);
        const updatedConfig = { ...b2bConfig, factories: updatedFactories };
        await onUpdateB2bConfig(updatedConfig);
        setFactories(updatedFactories);
        setSuccessMsg("کارخانه با موفقیت حذف شد.");
      } catch (err) {
        setErrorMsg("خطا در حذف کارخانه.");
      } finally {
        setLoading(false);
      }
    });
  };"""

new_delete = """  const handleDeleteFactory = async (factoryId: string) => {
    confirmAction("حذف کارخانه", "آیا از حذف این کارخانه اطمینان دارید؟", async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/b2b/factories/${factoryId}`, {
          method: "DELETE"
        });
        const data = await res.json();
        if (data.success) {
          setFactories(data.factories);
          if (onUpdateB2bConfig) {
            onUpdateB2bConfig({ ...b2bConfig, factories: data.factories });
          }
          setSuccessMsg("کارخانه با موفقیت حذف شد.");
        } else {
          throw new Error(data.error || "Failed to delete factory");
        }
      } catch (err) {
        console.error("Factory delete error:", err);
        setErrorMsg("خطا در حذف کارخانه.");
      } finally {
        setLoading(false);
      }
    });
  };"""

content = content.replace(old_active, new_active)
content = content.replace(old_featured, new_featured)
content = content.replace(old_delete, new_delete)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated AdminPanel.tsx")
