// SiYuan - Refactor your thinking
// Copyright (c) 2020-present, b3log.org
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

package conf

type User struct {
	UserId                          string       `json:"userId"`
	UserName                        string       `json:"userName"`
	UserAvatarURL                   string       `json:"userAvatarURL"`
	UserHomeBImgURL                 string       `json:"userHomeBImgURL"`
	UserTitles                      []*UserTitle `json:"userTitles"`
	UserIntro                       string       `json:"userIntro"`
	UserNickname                    string       `json:"userNickname"`
	UserCreateTime                  string       `json:"userCreateTime"`
	UserSiYuanProExpireTime         float64      `json:"userSiYuanProExpireTime"` // official account compatibility field
	UserToken                       string       `json:"userToken"`
	UserTokenExpireTime             string       `json:"userTokenExpireTime"`
	UserSiYuanRepoSize              float64      `json:"userSiYuanRepoSize"`              // official account compatibility field
	UserSiYuanPointExchangeRepoSize float64      `json:"userSiYuanPointExchangeRepoSize"` // official account compatibility field
	UserSiYuanAssetSize             float64      `json:"userSiYuanAssetSize"`             // official account compatibility field
	UserTrafficUpload               float64      `json:"userTrafficUpload"`
	UserTrafficDownload             float64      `json:"userTrafficDownload"`
	UserTrafficAPIGet               float64      `json:"userTrafficAPIGet"`
	UserTrafficAPIPut               float64      `json:"userTrafficAPIPut"`
	UserTrafficTime                 float64      `json:"userTrafficTime"`
	UserSiYuanSubscriptionPlan      float64      `json:"userSiYuanSubscriptionPlan"`   // official account compatibility field
	UserSiYuanSubscriptionStatus    float64      `json:"userSiYuanSubscriptionStatus"` // official account compatibility field
	UserSiYuanSubscriptionType      float64      `json:"userSiYuanSubscriptionType"`   // official account compatibility field
	UserSiYuanOneTimePayStatus      float64      `json:"userSiYuanOneTimePayStatus"`   // official account compatibility field
}

type UserTitle struct {
	Name string `json:"name"`
	Desc string `json:"desc"`
	Icon string `json:"icon"`
}
