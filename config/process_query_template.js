module.exports = function(TermGroup, TermSet) {
    return `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName="SharePoint PnP PowerShell Library" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009">
	<Actions>
		<ObjectPath Id="348" ObjectPathId="347" />
		<ObjectIdentityQuery Id="349" ObjectPathId="347" />
		<ObjectPath Id="351" ObjectPathId="350" />
		<ObjectIdentityQuery Id="352" ObjectPathId="350" />
		<ObjectPath Id="354" ObjectPathId="353" />
		<ObjectPath Id="356" ObjectPathId="355" />
		<ObjectIdentityQuery Id="357" ObjectPathId="355" />
		<ObjectPath Id="359" ObjectPathId="358" />
		<ObjectPath Id="361" ObjectPathId="360" />
		<ObjectIdentityQuery Id="362" ObjectPathId="360" />
		<ObjectPath Id="364" ObjectPathId="363" />
		<Query Id="365" ObjectPathId="363">
			<Query SelectAllProperties="false">
				<Properties />
			</Query>
			<ChildItemQuery SelectAllProperties="true">
				<Properties>
					<Property Name="Name" ScalarProperty="true" />
					<Property Name="Id" ScalarProperty="true" />
				</Properties>
			</ChildItemQuery>
		</Query>
	</Actions>
	<ObjectPaths>
		<StaticMethod Id="347" Name="GetTaxonomySession" TypeId="{981cbc68-9edc-4f8d-872f-71146fcbb84f}" />
		<Method Id="350" ParentId="347" Name="GetDefaultSiteCollectionTermStore" />
		<Property Id="353" ParentId="350" Name="Groups" />
		<Method Id="355" ParentId="353" Name="GetByName">
			<Parameters>
				<Parameter Type="String">${TermGroup}</Parameter>
			</Parameters>
		</Method>
		<Property Id="358" ParentId="355" Name="TermSets" />
		<Method Id="360" ParentId="358" Name="GetByName">
			<Parameters>
				<Parameter Type="String">${TermSet}</Parameter>
			</Parameters>
		</Method>
		<Property Id="363" ParentId="360" Name="Terms" />
	</ObjectPaths>
</Request>`;
}

