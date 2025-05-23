import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, InsertUser } from "@shared/schema";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DumbbellIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useState, useEffect, useTransition } from "react";
import * as z from 'zod';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";

const loginFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (user) {
      startTransition(() => {
        setLocation("/");
      });
    }
  }, [user, setLocation, startTransition]);

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  type ForgotPasswordFormData = {
    email: string;
  };

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(
      z.object({
        email: z.string().email(t('auth.invalidEmail')),
      })
    ),
    defaultValues: {
      email: ""
    }
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordFormData) => {
      const res = await apiRequest("POST", "/api/forgot-password", data);
      return res.json();
    },
    onSuccess: () => {
      startTransition(() => {
        toast({
          title: t('auth.checkEmail'),
          description: t('auth.resetLinkSent'),
        });
        setShowForgotPassword(false);
      });
    },
    onError: (error: Error) => {
      startTransition(() => {
        toast({
          title: t('auth.error'),
          description: error.message,
          variant: "destructive",
        });
      });
    },
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      role: "admin",
    },
  });

  const [loginError, setLoginError] = useState<string | null>(null);

  const onLoginSubmit = async (data: LoginFormData) => {
    setLoginError(null);
    try {
      await loginMutation.mutateAsync(data);
    } catch (error) {
      console.error("Login error:", error);
      // Set error message for display in the form
      setLoginError(error instanceof Error ? error.message : "Authentication failed");
      
      // Also show as a toast
      startTransition(() => {
        toast({
          title: t('auth.error'),
          description: error instanceof Error ? error.message : "Authentication failed",
          variant: "destructive",
        });
      });
    }
  };

  const onRegisterSubmit = async (data: InsertUser) => {
    try {
      await registerMutation.mutateAsync(data);
    } catch (error) {
      console.error("Registration error:", error);
      startTransition(() => {
        toast({
          title: t('auth.error'),
          description: error instanceof Error ? error.message : "Registration failed",
          variant: "destructive",
        });
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        <div className="text-center md:text-left space-y-4">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-8">
            <DumbbellIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Sports School CRM</h1>
            <div className="ml-4">
              <LanguageSwitcher />
            </div>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            {t('auth.welcome')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('auth.signInDescription')}
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>{t('auth.welcome')}</CardTitle>
            <CardDescription>{t('auth.signInDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t('auth.login')}</TabsTrigger>
                <TabsTrigger value="register">{t('auth.register')}</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    {loginError && (
                      <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-2">
                        {loginError}
                      </div>
                    )}
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.username')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.password')}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <Button
                        variant="link"
                        type="button"
                        className="px-0 text-sm"
                        onClick={() => startTransition(() => setShowForgotPassword(true))}
                      >
                        {t('auth.forgotPassword')}
                      </Button>
                    </div>
                    <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
                      {loginMutation.isPending ? "Signing in..." : t('auth.login')}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.username')}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.password')}</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.email')}</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                      {registerMutation.isPending ? "Creating account..." : t('auth.createAccount')}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            <Dialog open={showForgotPassword} onOpenChange={(open) => startTransition(() => setShowForgotPassword(open))}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('auth.resetPassword')}</DialogTitle>
                  <DialogDescription>
                    {t('auth.resetPasswordDescription')}
                  </DialogDescription>
                </DialogHeader>
                <Form {...forgotPasswordForm}>
                  <form
                    onSubmit={forgotPasswordForm.handleSubmit((data) =>
                      forgotPasswordMutation.mutate(data)
                    )}
                    className="space-y-4"
                  >
                    <FormField
                      control={forgotPasswordForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.email')}</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={forgotPasswordMutation.isPending}
                    >
                      {forgotPasswordMutation.isPending
                        ? t('auth.sending')
                        : t('auth.sendResetLink')}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}