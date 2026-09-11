"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { createAdvisor, createStudent } from "@/actions/admin";
import { UserRole } from "@prisma/client";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [userType, setUserType] = useState<"advisor" | "student">("advisor");
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    // Advisor fields
    specialization: "",
    experience: "",
    bio: "",
    maxStudents: "",
    // Student fields
    grade: "",
    school: "",
    targetUniversity: "",
    targetScore: "",
    currentScore: "",
    targetExam: "",
    examDate: ""
  });

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (userType === "advisor") {
        result = await createAdvisor({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          specialization: formData.specialization,
          experience: parseInt(formData.experience),
          bio: formData.bio,
          maxStudents: parseInt(formData.maxStudents)
        });
      } else {
        result = await createStudent({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          grade: formData.grade,
          school: formData.school,
          targetUniversity: formData.targetUniversity,
          targetScore: parseInt(formData.targetScore),
          currentScore: parseInt(formData.currentScore),
          targetExam: formData.targetExam,
          examDate: formData.examDate ? new Date(formData.examDate) : undefined
        });
      }

      if (result.success) {
        alert('Kullanıcı başarıyla oluşturuldu');
        setShowModal(false);
        setFormData({
          email: "",
          password: "",
          name: "",
          specialization: "",
          experience: "",
          bio: "",
          maxStudents: "",
          grade: "",
          school: "",
          targetUniversity: "",
          targetScore: "",
          currentScore: "",
          targetExam: "",
          examDate: ""
        });
        loadUsers();
      } else {
        alert('Hata: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    setApproving(userId);
    try {
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Kullanıcı başarıyla onaylandı');
        loadUsers();
      } else {
        alert('Hata: ' + data.error);
      }
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Bir hata oluştu');
    } finally {
      setApproving(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      'SUPER_ADMIN': 'bg-purple-100 text-purple-700',
      'ADVISOR': 'bg-blue-100 text-blue-700',
      'STUDENT': 'bg-green-100 text-green-700',
      'PARENT': 'bg-orange-100 text-orange-700',
    };
    return (
      <Badge className={roleColors[role] || 'bg-gray-100 text-gray-700'}>
        {role}
      </Badge>
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kullanıcı Yönetimi</h1>
          <p className="text-gray-600 mt-2">Sistemdeki tüm kullanıcıları görüntüleyin ve yönetin</p>
        </div>
        <Button 
          className="flex items-center space-x-2"
          onClick={() => setShowModal(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Kullanıcı Ekle</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Listesi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Soyad</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Onay Durumu</TableHead>
                <TableHead>Detaylar</TableHead>
                <TableHead>Kayıt Tarihi</TableHead>
                <TableHead>İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    {user.role === 'STUDENT' ? (
                      user.isApproved ? (
                        <Badge className="bg-green-100 text-green-700">Onaylı</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700">Onay Bekliyor</Badge>
                      )
                    ) : (
                      <Badge className="bg-gray-100 text-gray-700">N/A</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.advisorProfile && (
                      <span className="text-sm text-blue-600">Danışman</span>
                    )}
                    {user.studentProfile && (
                      <span className="text-sm text-green-600">Öğrenci</span>
                    )}
                    {user.parentProfile && (
                      <span className="text-sm text-orange-600">Veli</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {user.role === 'STUDENT' && !user.isApproved && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleApproveUser(user.id)}
                          disabled={approving === user.id}
                          className="bg-green-50 text-green-700 hover:bg-green-100"
                        >
                          {approving === user.id ? 'Onaylanıyor...' : 'Onayla'}
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        Düzenle
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Yeni Kullanıcı Ekle</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex space-x-4 mb-4">
                <button
                  type="button"
                  onClick={() => setUserType("advisor")}
                  className={`flex-1 py-2 px-4 rounded ${userType === "advisor" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
                >
                  Danışman
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("student")}
                  className={`flex-1 py-2 px-4 rounded ${userType === "student" ? "bg-green-600 text-white" : "bg-gray-200"}`}
                >
                  Öğrenci
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ad Soyad</label>
                  <Input
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">E-posta</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Şifre</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, password: e.target.value})}
                  required
                />
              </div>

              {userType === "advisor" && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Uzmanlık Alanı</label>
                    <Input
                      value={formData.specialization}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, specialization: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Deneyim (Yıl)</label>
                      <Input
                        type="number"
                        value={formData.experience}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, experience: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Maksimum Öğrenci</label>
                      <Input
                        type="number"
                        value={formData.maxStudents}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, maxStudents: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Biyografi</label>
                    <Textarea
                      value={formData.bio}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, bio: e.target.value})}
                      required
                    />
                  </div>
                </>
              )}

              {userType === "student" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sınıf</label>
                      <Input
                        value={formData.grade}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, grade: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Okul</label>
                      <Input
                        value={formData.school}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, school: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Hedef Üniversite</label>
                    <Input
                      value={formData.targetUniversity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, targetUniversity: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hedef Puan</label>
                      <Input
                        type="number"
                        value={formData.targetScore}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, targetScore: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Mevcut Puan</label>
                      <Input
                        type="number"
                        value={formData.currentScore}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, currentScore: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Hedef Sınav</label>
                      <Select
                        value={formData.targetExam}
                        onValueChange={(value) => setFormData({...formData, targetExam: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sınav seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YKS">YKS</SelectItem>
                          <SelectItem value="DGS">DGS</SelectItem>
                          <SelectItem value="MSÜ">MSÜ</SelectItem>
                          <SelectItem value="IELTS">IELTS</SelectItem>
                          <SelectItem value="TOEFL">TOEFL</SelectItem>
                          <SelectItem value="Diğer">Diğer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sınav Tarihi</label>
                      <Input
                        type="date"
                        value={formData.examDate}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, examDate: e.target.value})}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex space-x-4 pt-4">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Oluşturuluyor...' : 'Oluştur'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                  İptal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
