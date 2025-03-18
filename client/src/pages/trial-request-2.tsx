import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { InsertTrialRequest } from "@/types/trial-request";
import { api } from "@/utils/api";
// ... other imports

const schema = z.object({
  // ... your Zod schema
});

const TrialRequestForm = () => {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      // ... default values
    },
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const createTrialRequestMutation = useMutation({
    mutationFn: async (data: InsertTrialRequest) => {
      const response = await api.post("/api/trial-requests", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trial-requests"] });
      setShowSuccessModal(true);
      form.reset({
        // ... reset form values
      });
    },
    onError: (error) => {
      // Handle error, show toast message
      console.error("Error creating trial request:", error);
      // ... your error handling logic
    },
  });

  const onSubmit = (data: z.infer<typeof schema>) => {
    createTrialRequestMutation.mutate(data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* ... your form elements */}
      <button type="submit">Submit</button>
      {/* Success modal */}
      {showSuccessModal && (
          <div>Success!</div>
      )}
    </form>
  );
};

export default TrialRequestForm;