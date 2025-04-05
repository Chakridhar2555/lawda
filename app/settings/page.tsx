"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Bell, Mail, Shield, User, Building, Briefcase } from "lucide-react"

interface UserSettings {
  personal: {
    name: string
    username: string
    phone: string
    profileImage?: string
  }
  notifications: {
    emailAlerts: boolean
    smsAlerts: boolean
    leadNotifications: boolean
    showingReminders: boolean
    marketUpdates: boolean
    documentAlerts: boolean
  }
  emailSettings: {
    signature: string
    replyTemplate: string
    autoResponder: {
      enabled: boolean
      message: string
    }
    forwardingAddress: string
    templates: {
      birthdayWishes: {
        enabled: boolean
        template: string
        daysBefore: number
      }
      weddingGreetings: {
        enabled: boolean
        template: string
        daysAfter: number
      }
      seasonalWishes: {
        enabled: boolean
        holidays: {
          christmas: boolean
          newYear: boolean
          thanksgiving: boolean
          valentines: boolean
        }
        template: string
      }
      promotionalOffers: {
        enabled: boolean
        template: string
        discountCode: string
        expiryDays: number
      }
      referralCodes: {
        enabled: boolean
        template: string
        rewardAmount: string
      }
    }
  }
  preferences: {
    language: string
    timeZone: string
    currency: string
    dateFormat: string
    theme: 'light' | 'dark' | 'system'
  }
  security: {
    twoFactorEnabled: boolean
    lastPasswordChange: string
    loginAlerts: boolean
    trustedDevices: string[]
  }
  business: {
    serviceAreas: string[]
    specializations: string[]
    targetMarket: string
    commission: string
    teamMembers: string[]
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [settings, setSettings] = useState<UserSettings>({
    personal: {
      name: "",
      username: "",
      phone: "",
    },
    notifications: {
      emailAlerts: true,
      smsAlerts: true,
      leadNotifications: true,
      showingReminders: true,
      marketUpdates: false,
      documentAlerts: true,
    },
    emailSettings: {
      signature: "",
      replyTemplate: "",
      autoResponder: {
        enabled: false,
        message: "",
      },
      forwardingAddress: "",
      templates: {
        birthdayWishes: {
          enabled: false,
          template: "Dear {name},\n\nWishing you a wonderful birthday! As your real estate agent, I'm grateful to have you as a client.\n\nBest regards,\n{agentName}",
          daysBefore: 1
        },
        weddingGreetings: {
          enabled: false,
          template: "Dear {name},\n\nCongratulations on your wedding! Wishing you both a lifetime of happiness in your new home.\n\nBest regards,\n{agentName}",
          daysAfter: 1
        },
        seasonalWishes: {
          enabled: false,
          holidays: {
            christmas: true,
            newYear: true,
            thanksgiving: true,
            valentines: true
          },
          template: "Dear {name},\n\nWishing you a wonderful {holiday}! Thank you for being a valued client.\n\nBest regards,\n{agentName}"
        },
        promotionalOffers: {
          enabled: false,
          template: "Dear {name},\n\nAs a valued client, here's a special discount code: {discountCode}\nValid for {expiryDays} days.\n\nBest regards,\n{agentName}",
          discountCode: "",
          expiryDays: 30
        },
        referralCodes: {
          enabled: false,
          template: "Dear {name},\n\nShare your experience and earn {rewardAmount} for each successful referral!\nYour unique referral code: {referralCode}\n\nBest regards,\n{agentName}",
          rewardAmount: "$100"
        }
      }
    },
    preferences: {
      language: "en",
      timeZone: "America/Toronto",
      currency: "CAD",
      dateFormat: "MM/DD/YYYY",
      theme: "light",
    },
    security: {
      twoFactorEnabled: false,
      lastPasswordChange: new Date().toISOString(),
      loginAlerts: true,
      trustedDevices: [],
    },
    business: {
      serviceAreas: [],
      specializations: [],
      targetMarket: "",
      commission: "",
      teamMembers: [],
    },
  })

  useEffect(() => {
    // Load user profile and settings from the API
    const fetchData = async () => {
      try {
        // Fetch user profile
        const profileResponse = await fetch('/api/users/profile');

        if (!profileResponse.ok) {
          throw new Error('Failed to fetch user profile');
        }

        const profileData = await profileResponse.json();

        // Fetch settings
        const settingsResponse = await fetch('/api/settings');

        if (!settingsResponse.ok) {
          throw new Error('Failed to fetch settings');
        }

        const settingsData = await settingsResponse.json();

        // Merge profile data with settings
        setSettings(prevSettings => ({
          ...prevSettings,
          ...(Object.keys(settingsData).length > 0 ? settingsData : {}),
          personal: {
            ...prevSettings.personal,
            name: profileData.name || "",
            username: profileData.username || "",
            phone: profileData.phone || "",
          }
        }));
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load user data. Using default values.",
        });
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // First update the user profile data in the users collection
      const userResponse = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: settings.personal.name,
          username: settings.personal.username,
          phone: settings.personal.phone,
        }),
      })

      if (!userResponse.ok) {
        throw new Error('Failed to update user profile')
      }

      // Then update the settings in the settings collection
      const settingsResponse = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!settingsResponse.ok) {
        throw new Error('Failed to save settings')
      }

      toast({
        title: "Settings Updated",
        description: "Your settings have been successfully saved.",
      })
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings. Please try again.",
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">Settings</h1>

        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Business
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={settings.personal.name}
                        onChange={(e) => setSettings({
                          ...settings,
                          personal: { ...settings.personal, name: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={settings.personal.username}
                        onChange={(e) => setSettings({
                          ...settings,
                          personal: { ...settings.personal, username: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={settings.personal.phone}
                        onChange={(e) => setSettings({
                          ...settings,
                          personal: { ...settings.personal, phone: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                  <Button type="submit">Save Changes</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Broadcast Messages</h3>
                      <p className="text-sm text-muted-foreground">
                        Send notifications to all users
                      </p>
                    </div>
                    <Button
                      onClick={() => router.push('/settings/notifications')}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Send Notifications
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Email Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signature">Email Signature</Label>
                      <Textarea
                        id="signature"
                        value={settings.emailSettings.signature}
                        onChange={(e) => setSettings({
                          ...settings,
                          emailSettings: { ...settings.emailSettings, signature: e.target.value }
                        })}
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="replyTemplate">Reply Template</Label>
                      <Textarea
                        id="replyTemplate"
                        value={settings.emailSettings.replyTemplate}
                        onChange={(e) => setSettings({
                          ...settings,
                          emailSettings: { ...settings.emailSettings, replyTemplate: e.target.value }
                        })}
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="autoResponder">Auto Responder</Label>
                        <Switch
                          id="autoResponder"
                          checked={settings.emailSettings.autoResponder.enabled}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            emailSettings: {
                              ...settings.emailSettings,
                              autoResponder: {
                                ...settings.emailSettings.autoResponder,
                                enabled: checked
                              }
                            }
                          })}
                        />
                      </div>
                      {settings.emailSettings.autoResponder.enabled && (
                        <Textarea
                          value={settings.emailSettings.autoResponder.message}
                          onChange={(e) => setSettings({
                            ...settings,
                            emailSettings: {
                              ...settings.emailSettings,
                              autoResponder: {
                                ...settings.emailSettings.autoResponder,
                                message: e.target.value
                              }
                            }
                          })}
                          rows={4}
                          placeholder="Auto-response message..."
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Email Templates & Automation</h3>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Birthday Wishes</Label>
                          <p className="text-sm text-muted-foreground">Automated birthday emails for clients</p>
                        </div>
                        <Switch
                          checked={settings.emailSettings.templates.birthdayWishes.enabled}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            emailSettings: {
                              ...settings.emailSettings,
                              templates: {
                                ...settings.emailSettings.templates,
                                birthdayWishes: {
                                  ...settings.emailSettings.templates.birthdayWishes,
                                  enabled: checked
                                }
                              }
                            }
                          })}
                        />
                      </div>
                      {settings.emailSettings.templates.birthdayWishes.enabled && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Days Before Birthday</Label>
                              <Input
                                type="number"
                                value={settings.emailSettings.templates.birthdayWishes.daysBefore}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  emailSettings: {
                                    ...settings.emailSettings,
                                    templates: {
                                      ...settings.emailSettings.templates,
                                      birthdayWishes: {
                                        ...settings.emailSettings.templates.birthdayWishes,
                                        daysBefore: parseInt(e.target.value)
                                      }
                                    }
                                  }
                                })}
                              />
                            </div>
                          </div>
                          <Textarea
                            value={settings.emailSettings.templates.birthdayWishes.template}
                            onChange={(e) => setSettings({
                              ...settings,
                              emailSettings: {
                                ...settings.emailSettings,
                                templates: {
                                  ...settings.emailSettings.templates,
                                  birthdayWishes: {
                                    ...settings.emailSettings.templates.birthdayWishes,
                                    template: e.target.value
                                  }
                                }
                              }
                            })}
                            rows={4}
                            placeholder="Birthday email template..."
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Wedding Greetings</Label>
                          <p className="text-sm text-muted-foreground">Auto-sent congratulatory messages for newlywed clients</p>
                        </div>
                        <Switch
                          checked={settings.emailSettings.templates.weddingGreetings.enabled}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            emailSettings: {
                              ...settings.emailSettings,
                              templates: {
                                ...settings.emailSettings.templates,
                                weddingGreetings: {
                                  ...settings.emailSettings.templates.weddingGreetings,
                                  enabled: checked
                                }
                              }
                            }
                          })}
                        />
                      </div>
                      {settings.emailSettings.templates.weddingGreetings.enabled && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Days After Wedding</Label>
                              <Input
                                type="number"
                                value={settings.emailSettings.templates.weddingGreetings.daysAfter}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  emailSettings: {
                                    ...settings.emailSettings,
                                    templates: {
                                      ...settings.emailSettings.templates,
                                      weddingGreetings: {
                                        ...settings.emailSettings.templates.weddingGreetings,
                                        daysAfter: parseInt(e.target.value)
                                      }
                                    }
                                  }
                                })}
                              />
                            </div>
                          </div>
                          <Textarea
                            value={settings.emailSettings.templates.weddingGreetings.template}
                            onChange={(e) => setSettings({
                              ...settings,
                              emailSettings: {
                                ...settings.emailSettings,
                                templates: {
                                  ...settings.emailSettings.templates,
                                  weddingGreetings: {
                                    ...settings.emailSettings.templates.weddingGreetings,
                                    template: e.target.value
                                  }
                                }
                              }
                            })}
                            rows={4}
                            placeholder="Wedding greeting template..."
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Seasonal Wishes</Label>
                          <p className="text-sm text-muted-foreground">Ready-made email templates for major holidays</p>
                        </div>
                        <Switch
                          checked={settings.emailSettings.templates.seasonalWishes.enabled}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            emailSettings: {
                              ...settings.emailSettings,
                              templates: {
                                ...settings.emailSettings.templates,
                                seasonalWishes: {
                                  ...settings.emailSettings.templates.seasonalWishes,
                                  enabled: checked
                                }
                              }
                            }
                          })}
                        />
                      </div>
                      {settings.emailSettings.templates.seasonalWishes.enabled && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Holidays</Label>
                              <div className="space-y-2">
                                {Object.entries(settings.emailSettings.templates.seasonalWishes.holidays).map(([holiday, enabled]) => (
                                  <div key={holiday} className="flex items-center space-x-2">
                                    <Switch
                                      checked={enabled}
                                      onCheckedChange={(checked) => setSettings({
                                        ...settings,
                                        emailSettings: {
                                          ...settings.emailSettings,
                                          templates: {
                                            ...settings.emailSettings.templates,
                                            seasonalWishes: {
                                              ...settings.emailSettings.templates.seasonalWishes,
                                              holidays: {
                                                ...settings.emailSettings.templates.seasonalWishes.holidays,
                                                [holiday]: checked
                                              }
                                            }
                                          }
                                        }
                                      })}
                                    />
                                    <Label className="capitalize">{holiday}</Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <Textarea
                            value={settings.emailSettings.templates.seasonalWishes.template}
                            onChange={(e) => setSettings({
                              ...settings,
                              emailSettings: {
                                ...settings.emailSettings,
                                templates: {
                                  ...settings.emailSettings.templates,
                                  seasonalWishes: {
                                    ...settings.emailSettings.templates.seasonalWishes,
                                    template: e.target.value
                                  }
                                }
                              }
                            })}
                            rows={4}
                            placeholder="Seasonal wishes template..."
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Promotional Offers</Label>
                          <p className="text-sm text-muted-foreground">Personalized discount codes for leads and clients</p>
                        </div>
                        <Switch
                          checked={settings.emailSettings.templates.promotionalOffers.enabled}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            emailSettings: {
                              ...settings.emailSettings,
                              templates: {
                                ...settings.emailSettings.templates,
                                promotionalOffers: {
                                  ...settings.emailSettings.templates.promotionalOffers,
                                  enabled: checked
                                }
                              }
                            }
                          })}
                        />
                      </div>
                      {settings.emailSettings.templates.promotionalOffers.enabled && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Discount Code</Label>
                              <Input
                                value={settings.emailSettings.templates.promotionalOffers.discountCode}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  emailSettings: {
                                    ...settings.emailSettings,
                                    templates: {
                                      ...settings.emailSettings.templates,
                                      promotionalOffers: {
                                        ...settings.emailSettings.templates.promotionalOffers,
                                        discountCode: e.target.value
                                      }
                                    }
                                  }
                                })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Expiry Days</Label>
                              <Input
                                type="number"
                                value={settings.emailSettings.templates.promotionalOffers.expiryDays}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  emailSettings: {
                                    ...settings.emailSettings,
                                    templates: {
                                      ...settings.emailSettings.templates,
                                      promotionalOffers: {
                                        ...settings.emailSettings.templates.promotionalOffers,
                                        expiryDays: parseInt(e.target.value)
                                      }
                                    }
                                  }
                                })}
                              />
                            </div>
                          </div>
                          <Textarea
                            value={settings.emailSettings.templates.promotionalOffers.template}
                            onChange={(e) => setSettings({
                              ...settings,
                              emailSettings: {
                                ...settings.emailSettings,
                                templates: {
                                  ...settings.emailSettings.templates,
                                  promotionalOffers: {
                                    ...settings.emailSettings.templates.promotionalOffers,
                                    template: e.target.value
                                  }
                                }
                              }
                            })}
                            rows={4}
                            placeholder="Promotional offer template..."
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Referral Codes</Label>
                          <p className="text-sm text-muted-foreground">Automated referral links for client invitations</p>
                        </div>
                        <Switch
                          checked={settings.emailSettings.templates.referralCodes.enabled}
                          onCheckedChange={(checked) => setSettings({
                            ...settings,
                            emailSettings: {
                              ...settings.emailSettings,
                              templates: {
                                ...settings.emailSettings.templates,
                                referralCodes: {
                                  ...settings.emailSettings.templates.referralCodes,
                                  enabled: checked
                                }
                              }
                            }
                          })}
                        />
                      </div>
                      {settings.emailSettings.templates.referralCodes.enabled && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Reward Amount</Label>
                              <Input
                                value={settings.emailSettings.templates.referralCodes.rewardAmount}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  emailSettings: {
                                    ...settings.emailSettings,
                                    templates: {
                                      ...settings.emailSettings.templates,
                                      referralCodes: {
                                        ...settings.emailSettings.templates.referralCodes,
                                        rewardAmount: e.target.value
                                      }
                                    }
                                  }
                                })}
                              />
                            </div>
                          </div>
                          <Textarea
                            value={settings.emailSettings.templates.referralCodes.template}
                            onChange={(e) => setSettings({
                              ...settings,
                              emailSettings: {
                                ...settings.emailSettings,
                                templates: {
                                  ...settings.emailSettings.templates,
                                  referralCodes: {
                                    ...settings.emailSettings.templates.referralCodes,
                                    template: e.target.value
                                  }
                                }
                              }
                            })}
                            rows={4}
                            placeholder="Referral code template..."
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <Button type="submit">Save Email Settings</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <Switch
                      checked={settings.security.twoFactorEnabled}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        security: { ...settings.security, twoFactorEnabled: checked }
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Login Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified of new sign-ins to your account</p>
                    </div>
                    <Switch
                      checked={settings.security.loginAlerts}
                      onCheckedChange={(checked) => setSettings({
                        ...settings,
                        security: { ...settings.security, loginAlerts: checked }
                      })}
                    />
                  </div>
                  <Button onClick={handleSubmit}>Save Security Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business">
            <Card>
              <CardHeader>
                <CardTitle>Business Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Service Areas</Label>
                    <Input
                      value={settings.business.serviceAreas.join(", ")}
                      onChange={(e) => setSettings({
                        ...settings,
                        business: {
                          ...settings.business,
                          serviceAreas: e.target.value.split(",").map(area => area.trim())
                        }
                      })}
                      placeholder="Enter areas separated by commas"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Specializations</Label>
                    <Input
                      value={settings.business.specializations.join(", ")}
                      onChange={(e) => setSettings({
                        ...settings,
                        business: {
                          ...settings.business,
                          specializations: e.target.value.split(",").map(spec => spec.trim())
                        }
                      })}
                      placeholder="Enter specializations separated by commas"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Market</Label>
                    <Input
                      value={settings.business.targetMarket}
                      onChange={(e) => setSettings({
                        ...settings,
                        business: { ...settings.business, targetMarket: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Commission Structure</Label>
                    <Input
                      value={settings.business.commission}
                      onChange={(e) => setSettings({
                        ...settings,
                        business: { ...settings.business, commission: e.target.value }
                      })}
                    />
                  </div>
                  <Button type="submit">Save Business Settings</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}

