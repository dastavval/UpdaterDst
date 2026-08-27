sed -i -e '/rawMaterialAds={rawMaterialAds}/i \
            products={products}\
            onUpdateProductStatus={async (id, isApproved, reason) => {\
              await onUpdateProduct(id, {\
                approvalStatus: isApproved ? '"'"'approved'"'"' : '"'"'rejected'"'"',\
                isApproved: isApproved,\
                rejectionReason: reason\
              });\
            }}' src/components/AdminPanel.tsx
